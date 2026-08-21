#!/usr/bin/env python3
"""Generate a Mermaid graph from the knowledge unit and reasoning edge databases.

Usage:
    python3 scripts/graph-visualize.py --format mermaid [OPTIONS]

Options:
    --format mermaid          Output format (currently only mermaid supported)
    --filter-pipeline <name>  Show only edges from this pipeline
    --filter-domain <name>    Show only edges with this domain (matches compound domains too)
    --filter-relation <name>  Show only edges with this relation type
    --output <path>           Write output to file instead of stdout
    --stats                   Print summary statistics instead of graph
    --communities             Detect communities via Louvain algorithm and print report
    --community-filter N      When combined with --format mermaid, only render nodes in community N
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

KU_PATH = os.path.join(PROJECT_ROOT, "god-learn", "knowledge.jsonl")
EDGE_PATH = os.path.join(PROJECT_ROOT, "god-reason", "reasoning.jsonl")

DOMAIN_COLORS = {
    "temporal": "#dff",
    "kinetic": "#fed",
    "perceptual": "#dfd",
    "cognitive": "#edf",
    "affective": "#fdd",
    "existential": "#f9f",
    "rhetorical": "#ffd",
    "biosemiotic": "#dfe",
}

DEFAULT_COLOR = "#eee"

# Pipeline display order for deterministic output
PIPELINE_ORDER = [
    "phantasia", "rickert", "bt", "bcap", "uexkull", "aristotle",
]

# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_jsonl(path):
    """Load a JSONL file, returning a list of dicts. Skips blank lines."""
    items = []
    if not os.path.exists(path):
        print(f"Warning: {path} not found", file=sys.stderr)
        return items
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return items


def load_data():
    kus = load_jsonl(KU_PATH)
    edges = load_jsonl(EDGE_PATH)
    ku_index = {ku["id"]: ku for ku in kus}
    return kus, edges, ku_index

# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

def filter_edges(edges, pipeline=None, domain=None, relation=None):
    """Apply CLI filters to the edge list."""
    result = edges
    if pipeline:
        result = [e for e in result if e.get("pipeline", "") == pipeline]
    if domain:
        # Match compound domains like "affective/existential" if the filter
        # matches any component.
        result = [e for e in result if domain in e.get("domain", "").split("/")]
    if relation:
        result = [e for e in result if e.get("relation", "") == relation]
    return result

# ---------------------------------------------------------------------------
# Graph helpers
# ---------------------------------------------------------------------------

def primary_domain(domain_str):
    """Return the first component of a possibly-compound domain string."""
    if not domain_str:
        return ""
    return domain_str.split("/")[0]


def color_for_domain(domain_str):
    """Return a hex color for a domain, using the primary component."""
    return DOMAIN_COLORS.get(primary_domain(domain_str), DEFAULT_COLOR)


def sanitize_node_id(name):
    """Make a node name safe for Mermaid IDs. Replace non-alphanumeric chars."""
    return name.replace(" ", "_").replace("-", "_").replace("'", "").replace("(", "").replace(")", "")


def has_knowledge_backing(edge):
    """Return True if the edge has non-empty knowledge_ids."""
    kids = edge.get("knowledge_ids")
    return bool(kids and len(kids) > 0)


def is_corroborated(edge, threshold=1.5):
    """Return True if the edge has a corroboration_score >= threshold."""
    score = edge.get("corroboration_score")
    if score is None:
        return False
    return float(score) >= threshold

# ---------------------------------------------------------------------------
# Mermaid generation
# ---------------------------------------------------------------------------

def generate_mermaid(edges, ku_index):
    """Generate a Mermaid flowchart string from edges."""
    lines = []
    lines.append("graph LR")
    lines.append("")

    # Gather nodes per pipeline, tracking domain for each node.
    # A node's domain is determined by the most frequent domain it appears in.
    node_domain_counts = defaultdict(Counter)   # node -> Counter(domain)
    node_pipelines = defaultdict(set)           # node -> set of pipelines

    for edge in edges:
        pipeline = edge.get("pipeline", "unknown")
        domain = edge.get("domain", "")
        src = edge["source"]
        tgt = edge["target"]
        node_domain_counts[src][domain] += 1
        node_domain_counts[tgt][domain] += 1
        node_pipelines[src].add(pipeline)
        node_pipelines[tgt].add(pipeline)

    # Assign each node to a single pipeline (first in PIPELINE_ORDER, or
    # the one it appears most in).
    def pick_pipeline(node):
        pips = node_pipelines.get(node, set())
        for p in PIPELINE_ORDER:
            if p in pips:
                return p
        # Check bridge pipelines
        for p in sorted(pips):
            if p.startswith("bridge_"):
                return p
        return sorted(pips)[0] if pips else "unknown"

    # Build pipeline -> nodes mapping
    pipeline_nodes = defaultdict(set)
    all_nodes = set()
    for edge in edges:
        all_nodes.add(edge["source"])
        all_nodes.add(edge["target"])
    for node in all_nodes:
        pipeline_nodes[pick_pipeline(node)].add(node)

    # Determine display domain for each node
    node_domain = {}
    for node in all_nodes:
        counts = node_domain_counts[node]
        if counts:
            node_domain[node] = counts.most_common(1)[0][0]
        else:
            node_domain[node] = ""

    # Sort pipelines for deterministic output
    sorted_pipelines = []
    for p in PIPELINE_ORDER:
        if p in pipeline_nodes:
            sorted_pipelines.append(p)
    for p in sorted(pipeline_nodes.keys()):
        if p not in sorted_pipelines:
            sorted_pipelines.append(p)

    # Emit subgraphs
    for pipeline in sorted_pipelines:
        nodes = sorted(pipeline_nodes[pipeline])
        if not nodes:
            continue
        safe_pipeline = sanitize_node_id(pipeline)
        lines.append(f"    subgraph {safe_pipeline}[\"{pipeline}\"]")
        for node in nodes:
            safe = sanitize_node_id(node)
            label = node.replace("_", " ")
            lines.append(f"        {safe}[\"{label}\"]")
        lines.append("    end")
        lines.append("")

    # Emit edges
    lines.append("    %% Edges")
    for edge in edges:
        src = sanitize_node_id(edge["source"])
        tgt = sanitize_node_id(edge["target"])
        rel = edge.get("relation", "?")

        if is_corroborated(edge):
            # Thick line for corroborated
            lines.append(f"    {src} ==>|\"{rel}\"| {tgt}")
        elif has_knowledge_backing(edge):
            # Normal arrow for KU-backed
            lines.append(f"    {src} -->|\"{rel}\"| {tgt}")
        else:
            # Dotted arrow for structural-only
            lines.append(f"    {src} -.->|\"{rel}\"| {tgt}")

    lines.append("")

    # Emit style statements for domain coloring
    lines.append("    %% Domain coloring")
    styled = set()
    for node in sorted(all_nodes):
        safe = sanitize_node_id(node)
        if safe in styled:
            continue
        styled.add(safe)
        dom = node_domain.get(node, "")
        color = color_for_domain(dom)
        lines.append(f"    style {safe} fill:{color},stroke:#333,stroke-width:1px")

    lines.append("")

    # Legend as a separate subgraph
    lines.append("    subgraph legend[\"Legend\"]")
    lines.append("        direction TB")
    for dom, color in DOMAIN_COLORS.items():
        safe_dom = f"legend_{dom}"
        lines.append(f"        {safe_dom}[\"{dom}\"]")
        lines.append(f"        style {safe_dom} fill:{color},stroke:#333,stroke-width:1px")
    lines.append("        legend_ku[\"--- KU-backed\"]")
    lines.append("        legend_struct[\"-..- structural only\"]")
    lines.append("        legend_corrob[\"=== corroborated\"]")
    lines.append("    end")

    return "\n".join(lines)

# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

def compute_stats(edges, kus):
    """Compute and return a formatted statistics string."""
    out = []

    # Collect all nodes
    nodes = set()
    for e in edges:
        nodes.add(e["source"])
        nodes.add(e["target"])

    out.append(f"Total nodes:  {len(nodes)}")
    out.append(f"Total edges:  {len(edges)}")
    out.append(f"Knowledge units:  {len(kus)}")
    out.append("")

    # Edges by relation
    rel_counts = Counter(e.get("relation", "?") for e in edges)
    out.append("Edges by relation:")
    for rel, count in rel_counts.most_common():
        out.append(f"  {rel:30s} {count:4d}")
    out.append("")

    # Edges by pipeline
    pip_counts = Counter(e.get("pipeline", "?") for e in edges)
    out.append("Edges by pipeline:")
    for pip, count in pip_counts.most_common():
        out.append(f"  {pip:30s} {count:4d}")
    out.append("")

    # Edges by domain (primary component)
    dom_counts = Counter(primary_domain(e.get("domain", "?")) for e in edges)
    out.append("Edges by domain (primary):")
    for dom, count in dom_counts.most_common():
        out.append(f"  {dom:30s} {count:4d}")
    out.append("")

    # KU-backed vs structural
    ku_backed = sum(1 for e in edges if has_knowledge_backing(e))
    out.append(f"KU-backed edges:       {ku_backed}")
    out.append(f"Structural-only edges: {len(edges) - ku_backed}")
    out.append("")

    # Corroborated edges
    corrob = sum(1 for e in edges if is_corroborated(e))
    out.append(f"Corroborated edges (score >= 1.5): {corrob}")
    out.append("")

    # Node degree
    degree = Counter()
    for e in edges:
        degree[e["source"]] += 1
        degree[e["target"]] += 1
    if degree:
        avg_deg = sum(degree.values()) / len(degree)
        max_node = degree.most_common(1)[0]
        out.append(f"Average node degree: {avg_deg:.2f}")
        out.append(f"Max degree node:     {max_node[0]} ({max_node[1]})")
    out.append("")

    # Disconnected clusters via union-find
    parent = {}

    def find(x):
        while parent.get(x, x) != x:
            parent[x] = parent.get(parent[x], parent[x])
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for e in edges:
        union(e["source"], e["target"])

    clusters = len(set(find(n) for n in nodes))
    out.append(f"Disconnected clusters: {clusters}")

    # Top 10 most connected nodes
    out.append("")
    out.append("Top 10 most connected nodes:")
    for node, deg in degree.most_common(10):
        out.append(f"  {node:30s} {deg:4d}")

    return "\n".join(out)

# ---------------------------------------------------------------------------
# Community detection
# ---------------------------------------------------------------------------

def _require_networkx():
    """Import and return networkx, or exit with a helpful message."""
    try:
        import networkx as nx
        return nx
    except ImportError:
        print(
            "Error: networkx is required for community detection.\n"
            "Install it with:  pip install networkx",
            file=sys.stderr,
        )
        sys.exit(1)


def detect_communities(edges):
    """Run Louvain community detection on the reasoning edge graph.

    Returns a dict with:
        communities: list of dicts, each with:
            id, nodes, dominant_domain, dominant_pipeline, label, top_concepts
        inter_community_edges: int
    """
    nx = _require_networkx()
    from networkx.algorithms.community import louvain_communities

    G = nx.Graph()
    # Track per-node domain and pipeline counts for later aggregation
    node_domain_counts = defaultdict(Counter)
    node_pipeline_counts = defaultdict(Counter)

    for edge in edges:
        src = edge["source"]
        tgt = edge["target"]
        domain = edge.get("domain", "")
        pipeline = edge.get("pipeline", "")
        G.add_edge(src, tgt)
        node_domain_counts[src][primary_domain(domain)] += 1
        node_domain_counts[tgt][primary_domain(domain)] += 1
        node_pipeline_counts[src][pipeline] += 1
        node_pipeline_counts[tgt][pipeline] += 1

    if G.number_of_nodes() == 0:
        return {"communities": [], "inter_community_edges": 0}

    # Louvain returns a list of frozensets
    raw_communities = louvain_communities(G, seed=42)

    # Sort by size descending for stable, readable output
    raw_communities = sorted(raw_communities, key=len, reverse=True)

    # Build node -> community_id mapping for inter-community edge counting
    node_to_community = {}
    communities = []

    for idx, member_set in enumerate(raw_communities):
        members = sorted(member_set)
        node_to_community.update({n: idx for n in members})

        # Aggregate domains and pipelines across all nodes in the community
        domain_agg = Counter()
        pipeline_agg = Counter()
        for node in members:
            domain_agg.update(node_domain_counts[node])
            pipeline_agg.update(node_pipeline_counts[node])

        dominant_domain = domain_agg.most_common(1)[0][0] if domain_agg else ""
        dominant_pipeline = pipeline_agg.most_common(1)[0][0] if pipeline_agg else ""

        # Top concepts: use node degree within the community subgraph to rank
        subgraph = G.subgraph(members)
        degree_in_community = sorted(
            subgraph.degree(), key=lambda x: x[1], reverse=True
        )
        top_concepts = [name for name, _deg in degree_in_community[:5]]

        # Derive a human-readable label
        label = f"{dominant_domain}/{top_concepts[0]}" if top_concepts else dominant_domain

        communities.append({
            "id": idx,
            "nodes": members,
            "dominant_domain": dominant_domain,
            "dominant_pipeline": dominant_pipeline,
            "label": label,
            "top_concepts": top_concepts,
        })

    # Count inter-community edges
    inter_community = 0
    for edge in edges:
        src_c = node_to_community.get(edge["source"])
        tgt_c = node_to_community.get(edge["target"])
        if src_c is not None and tgt_c is not None and src_c != tgt_c:
            inter_community += 1

    return {
        "communities": communities,
        "inter_community_edges": inter_community,
    }


def format_community_report(result):
    """Format the community detection result as a human-readable string."""
    out = []
    communities = result["communities"]
    out.append(f"Communities detected (Louvain): {len(communities)}")
    out.append(f"Inter-community edges:         {result['inter_community_edges']}")
    out.append("")

    for c in communities:
        out.append(f"  Community {c['id']}: \"{c['label']}\"")
        out.append(f"    Size:              {len(c['nodes'])} nodes")
        out.append(f"    Dominant domain:   {c['dominant_domain']}")
        out.append(f"    Dominant pipeline: {c['dominant_pipeline']}")
        out.append(f"    Top concepts:      {', '.join(c['top_concepts'])}")
        out.append("")

    return "\n".join(out)


def filter_edges_by_community(edges, community_result, community_id):
    """Return only edges where both source and target belong to the given community."""
    communities = community_result["communities"]
    if community_id < 0 or community_id >= len(communities):
        print(
            f"Error: community {community_id} does not exist. "
            f"Valid range: 0-{len(communities) - 1}",
            file=sys.stderr,
        )
        sys.exit(1)

    allowed_nodes = set(communities[community_id]["nodes"])
    return [
        e for e in edges
        if e["source"] in allowed_nodes and e["target"] in allowed_nodes
    ]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Generate a Mermaid graph from KU/reasoning-edge databases."
    )
    parser.add_argument(
        "--format", choices=["mermaid"], default="mermaid",
        help="Output format (default: mermaid)"
    )
    parser.add_argument(
        "--filter-pipeline", dest="pipeline", default=None,
        help="Show only edges from this pipeline"
    )
    parser.add_argument(
        "--filter-domain", dest="domain", default=None,
        help="Show only edges matching this domain (matches compound domains)"
    )
    parser.add_argument(
        "--filter-relation", dest="relation", default=None,
        help="Show only edges with this relation type"
    )
    parser.add_argument(
        "--output", "-o", default=None,
        help="Write output to file instead of stdout"
    )
    parser.add_argument(
        "--stats", action="store_true",
        help="Print summary statistics instead of graph"
    )
    parser.add_argument(
        "--communities", action="store_true",
        help="Detect communities via Louvain algorithm and print report"
    )
    parser.add_argument(
        "--community-filter", dest="community_filter", type=int, default=None,
        metavar="N",
        help="When combined with --format mermaid, only render nodes in community N"
    )
    args = parser.parse_args()

    kus, edges, ku_index = load_data()
    edges = filter_edges(edges, args.pipeline, args.domain, args.relation)

    if not edges:
        print("No edges match the given filters.", file=sys.stderr)
        sys.exit(1)

    # If community-filter is requested, narrow the edge set first
    if args.community_filter is not None:
        community_result = detect_communities(edges)
        edges = filter_edges_by_community(edges, community_result, args.community_filter)
        if not edges:
            print("No edges remain after community filter.", file=sys.stderr)
            sys.exit(1)

    if args.communities:
        result = detect_communities(edges)
        output = format_community_report(result)
    elif args.stats:
        output = compute_stats(edges, kus)
    else:
        output = generate_mermaid(edges, ku_index)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(output)
            fh.write("\n")
        print(f"Written to {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
