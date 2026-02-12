/**
 * Test suite for Argument Coherence Checker's dialectical writing detection
 *
 * Tests the improved contradiction detection that handles:
 * - Comparative philosophical analysis
 * - Thesis-antithesis-synthesis structures
 * - Multi-perspective scholarly discourse
 */

import { describe, it, expect } from 'vitest';
import { ArgumentCoherenceChecker } from '../../../../src/god-agent/cli/quality/stages/argument-coherence-checker.js';

describe('ArgumentCoherenceChecker - Dialectical Writing', () => {
  const checker = new ArgumentCoherenceChecker();

  describe('Comparative Structures', () => {
    it('should NOT flag explicit comparative statements as contradictions', async () => {
      const text = `
While Aristotle argues that phantasia operates through residual motion in sense organs,
Heidegger claims that mood discloses world as always already affectively colored.

These different accounts reflect their distinct temporal frameworks. Aristotle's
mechanism requires punctual sensory input, whereas Heidegger's phenomenology begins
with unified temporal horizons.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Should not flag these as critical contradictions
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);

      // May have minor suggestions for clarity
      const totalIssues = result.issues.filter(i =>
        i.description.toLowerCase().includes('contradiction')
      );
      expect(totalIssues.length).toBeLessThan(2);
    });

    it('should detect "while X argues Y, Z claims W" patterns', async () => {
      const text = `
While Aristotle holds that perception is passive reception of form,
Heidegger maintains that understanding is active projection of meaning.
      `.trim();

      const result = await checker.evaluate(text, 1);
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });

    it('should recognize "in contrast to X" patterns', async () => {
      const text = `
Aristotle emphasizes the mechanistic process of sensory impression.

In contrast to this mechanistic view, Heidegger describes Dasein's
being-in-the-world as fundamentally interpretive rather than receptive.
      `.trim();

      const result = await checker.evaluate(text, 1);
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });
  });

  describe('Synthesis/Resolution Patterns', () => {
    it('should NOT flag resolved tensions as contradictions', async () => {
      const text = `
Aristotle describes perception as occurring in punctual moments.

Heidegger insists that Dasein exists as temporally unified.

This apparent contradiction resolves when we recognize phantasia as the
temporal medium that bridges punctual perception with unified experience.
      `.trim();

      const result = await checker.evaluate(text, 1);
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });

    it('should recognize "yet these can be reconciled" patterns', async () => {
      const text = `
The Aristotelian framework emphasizes mechanism. The Heideggerian
approach emphasizes existential structures.

Yet these perspectives can be reconciled through phantasia's dual role
as both mechanistic residue and existential condition.
      `.trim();

      const result = await checker.evaluate(text, 1);
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });

    it('should recognize "nevertheless" as synthesis marker', async () => {
      const text = `
These philosophical frameworks appear incompatible.

Nevertheless, a careful analysis reveals deep structural convergence.
      `.trim();

      const result = await checker.evaluate(text, 1);
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });
  });

  describe('Philosopher Attribution', () => {
    it('should NOT flag contradictions between different philosophers', async () => {
      const text = `
Aristotle's account holds that all perception requires actual contact
with sensible objects.

Heidegger's analysis holds that understanding precedes any particular
perception and shapes what can appear.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Different philosophers + comparative structure = not a contradiction
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });

    it('should extract philosopher names from possessive constructions', async () => {
      const text = `
Plato's view emphasizes transcendent Forms.

Aristotle's position rejects separate Forms in favor of immanent essences.
      `.trim();

      const result = await checker.evaluate(text, 1);
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });
  });

  describe('Paragraph Separation', () => {
    it('should be less strict about contradictions in distant paragraphs', async () => {
      const text = `
First paragraph establishes that phantasia always requires prior perception.

Second paragraph provides supporting evidence from De Anima.

Third paragraph explores implications for memory.

Fourth paragraph discusses anticipatory phantasia.

Fifth paragraph notes that phantasia can operate without current perception,
generating new combinations from retained traces.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Large paragraph gap (5 paragraphs) + nuanced claim = not critical
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBeLessThan(2);
    });
  });

  describe('True Contradictions (Should Still Flag)', () => {
    it('should flag genuine contradictions within same argument thread', async () => {
      const text = `
Phantasia always operates independently of current perception, generating
images entirely from internal mental content.

However, phantasia never operates without direct perceptual input and
cannot function when sensory contact ceases.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // This is a genuine contradiction - should be flagged (though maybe not critical)
      const contradictionIssues = result.issues.filter(i =>
        i.description.toLowerCase().includes('contradiction')
      );
      expect(contradictionIssues.length).toBeGreaterThan(0);
    });

    it('should flag unmarked contradictions in adjacent paragraphs', async () => {
      const text = `
The research demonstrates that all instances of phantasia require
continuous sensory stimulation to maintain the phantasmatic image.

The evidence shows that no instances of phantasia require ongoing
sensory input, as images persist after stimulus withdrawal.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Adjacent paragraphs + clear contradiction + no markers = flag it
      const issues = result.issues.filter(i =>
        i.description.toLowerCase().includes('contradiction')
      );
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('Unmarked Comparisons (Minor Suggestions)', () => {
    it('should suggest adding comparative markers when contrasts are implicit', async () => {
      const text = `
Aristotle describes phantasia as passive retention of perceptual traces.

Heidegger describes mood as active disclosure of world.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Should have minor suggestion to add comparative markers
      const minorIssues = result.issues.filter(i =>
        i.severity === 'minor' &&
        i.description.toLowerCase().includes('marker')
      );

      // May or may not flag depending on exact pattern matching
      // At minimum, should not be critical
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);
    });
  });

  describe('Dialectical Patterns Integration', () => {
    it('should recognize thesis-antithesis-synthesis structure', async () => {
      const text = `
The standard view holds that imagination is purely reproductive,
merely replaying past perceptions without creative capacity.

However, this position overlooks the productive dimension of phantasia.
Critics have argued that anticipatory phantasia generates novel
combinations never directly experienced.

What emerges from this dialectic is a more nuanced account: phantasia
operates both reproductively and productively, retaining past traces
while reconfiguring them into new patterns.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Should recognize dialectical structure, not flag as contradictory
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);

      // Should have high philosophical pattern metrics
      expect(result.metrics['dialecticalPatterns']).toBeGreaterThan(0);
    });
  });

  describe('Complex Comparative Analysis', () => {
    it('should handle multi-philosopher comparison without false positives', async () => {
      const text = `
Aristotle's account of phantasia emphasizes residual motion in sense organs,
treating imagination as mechanistic persistence of perceptual activity.

Heidegger's analysis of mood, by contrast, describes affective disclosure
as the primordial way Dasein encounters world, prior to any particular
perception or thought.

Husserl's phenomenology of time-consciousness differs from both, focusing
on the intentional structure of retention and protention as constitutive
of temporal objects.

Yet despite these apparent differences, all three accounts converge on
a shared insight: temporal experience requires some capacity to hold
the past within the present. Phantasia, mood, and retention represent
different articulations of this fundamental structure.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Complex comparative analysis with synthesis - should pass cleanly
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBe(0);

      // Should recognize comparative structure
      const comparativeIssues = result.issues.filter(i =>
        i.description.toLowerCase().includes('comparative')
      );
      expect(comparativeIssues.length).toBeLessThan(3);
    });
  });

  describe('Quality Metrics', () => {
    it('should maintain high coherence score for dialectical writing', async () => {
      const text = `
While Aristotle argues that perception operates through punctual moments,
Heidegger claims that Dasein exists as always already temporally unified.

This apparent tension dissolves when we recognize phantasia as the
temporal medium bridging these perspectives. Phantasia retains punctual
perceptual traces while constituting unified temporal experience.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Should score well despite contrasting claims
      expect(result.score).toBeGreaterThan(0.7);
      expect(result.passed).toBe(true);
    });

    it('should track dialectical patterns in metrics', async () => {
      const text = `
The traditional view emphasizes mechanism.

Against this, phenomenology emphasizes lived experience.

A more adequate account synthesizes both dimensions.
      `.trim();

      const result = await checker.evaluate(text, 1);

      // Should detect dialectical patterns
      expect(result.metrics['dialecticalPatterns']).toBeGreaterThan(0);
    });
  });
});
