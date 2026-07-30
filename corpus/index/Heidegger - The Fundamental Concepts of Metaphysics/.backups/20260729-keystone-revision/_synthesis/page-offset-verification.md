# Page-Offset Verification — FCM 2-up scan (Phase 0 gate)

**Source:** `corpus/metaphysics/Heidegger, Martin - The Fundamental Concepts of Metaphysics.pdf`
**Physical form:** 200 PDF pages, 833×612 pt landscape = **2-up scan** (two book pages side by side per PDF page).
**Verified:** 2026-06-19.

## The formula

```
book_page(left  column) = 2·pdf_page − 24      (even/left page)
book_page(right column) = 2·pdf_page − 23      (odd/right page)
pdf_page                = ⌊(book_page + 24) / 2⌋
```

Each PDF page holds an even (left) and the following odd (right) book page. Front matter (roman) occupies PDF pp.1–11; Arabic book p.1 begins ≈ PDF p.12.

## Empirical anchors (running-head evidence)

| PDF p. | book pp. (heads) | German GA bracket | content anchor |
|---|---|---|---|
| 30 | 36–37 | [54–55] / [55–57] | §11 changeover of *meta* |
| 31 | 38–39 | [57–58] / [58–60] | §11 cont. |
| 49 | 74–75 | [110–11] / [111–13] | **§18c first naming of profound boredom** |
| 51 | 78–79 | [118–19] | **Ch.2 First Form of Boredom** opens |
| 80 | 136–137 | [204–206] / [206–207] | §31 being-left-empty / held-in-limbo |
| 96 | 168–169 | [252–53] / [253–54] | §39 (time as root of the three questions) |

All consistent with `book = 2·pdf − 24`.

## Citation policy

- Record a **triple locus** on every reference: `(p.NN / GA pp.NN / pdf NN)`.
- The **GA (Klostermann) pagination drifts** relative to the English (74→[110], 136→[206], 170→[252]); it is **non-linear** — always read the bracket from the page's running head, never compute it.
- OCR of the brackets is noisy (e.g. `[1 10-1 1]` = `[110–11]`); normalize when transcribing.

## Extraction method

- **Boredom spine (fcm-03…fcm-09):** per-page **column-split** — `pdftotext -layout -x 0 -W 416` (left/even page) then `-x 416 -W 417` (right/odd page), concatenated in reading order → clean single-book-page text.
- **Lighter units:** whole-range `pdftotext -layout` (two-column; left column = even page, right = next).
- Working text cached at `/tmp/fcm-text/fcm-NN-*.txt`.
