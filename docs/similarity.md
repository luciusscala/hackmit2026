# Similarity methodology

This document specifies how `map-pipeline/similarity.py` decides which projects
are connected on the 3D map, how they are positioned, and how themes are
labelled. Every threshold was chosen empirically. The figures below come from a
660-project corpus, of which 425 projects (90,100 pairs) had writeups long
enough to analyze.

## Text representation

Each project is represented by a TF-IDF vector of unigrams and bigrams, built
only from the writeup sections the team wrote: description, what it does,
inspiration, how it was built, challenges and accomplishments. Track names and
sponsor-challenge titles are excluded, so shared labels cannot inflate
similarity.

## Signals evaluated and rejected

Several categorical signals were tested to see whether they predict writeup
similarity. Mean pairwise cosine similarity by signal:

| Signal | Mean cosine | Difference from baseline | Conclusion |
|---|---|---|---|
| All pairs (baseline) | 0.042 | – | |
| Same track | 0.051 | +0.009 | Weak. Projects' nearest neighbor shares their track 35% of the time, versus 17% by chance |
| Different track | 0.042 | 0.000 | |
| Share only a top-5 sponsor challenge | 0.052 | +0.010 | Weak; the most popular challenge was entered by 144 projects |
| Share a less common sponsor challenge | 0.074 | +0.032 | Moderate; used only as a minor weighting factor |
| Share no sponsor challenge | 0.038 | −0.004 | |

The correlation between writeup similarity and sponsor-challenge overlap is
0.18, so challenge tags are a poor proxy for content.

**Consequences:**

- **Track never contributes to a connection.** Including it would connect every
  pair within a track and obscure the genuine content matches.
- **Popular sponsor challenges never contribute.** They are recorded on an edge
  (`shared_sponsors_ignored`) for transparency but carry zero weight.

## Edge criteria

Two projects are connected only if all four conditions hold:

1. **Sufficient content.** Both writeups are at least 200 characters. Shorter
   records (88% of HackMIT 2026 at collection time) appear on the map with low
   confidence and no connections.
2. **Mutual nearest neighbors.** Each project is among the other's 10 nearest
   neighbors by cosine similarity.
3. **Similarity floor.** Cosine similarity is at least 0.14, roughly the 98th
   percentile of all pairs (the median pair scores 0.036).
4. **Shared distinctive terms.** Each project has a signature: its 25
   highest-weighted terms, excluding generic hackathon vocabulary and any term
   that appears in more than 20% of writeups. The two signatures must share
   - at least 4 terms, or
   - at least 3 terms, one of which is rare (in 15 or fewer writeups) or a bigram, or
   - at least 2 rare terms.

The fourth condition prevents connections based only on generic vocabulary,
such as two unrelated game projects that share "game", "fun" and "inspired".

## Edge weight

Once an edge exists, its weight is:

```
weight = 0.72 × scale(cosine, 0.14 → 0.45)
       + 0.22 × min(1, shared_signature_terms / 6)
       + 0.06 × min(1, Σ IDF(shared uncommon sponsor challenges) / 12)
```

Cosine similarity dominates because it is the only term that measures the full
writeup. Shared signature terms make each edge explainable, and uncommon sponsor
challenges act as a small tie-breaker.

## 3D layout

Eligible writeups are reduced to 64 dimensions with truncated SVD and then
projected to 3D with UMAP (cosine metric, `n_neighbors=12`, `min_dist=0.2`).
UMAP was chosen over PCA because it preserves local structure far better on this
corpus:

| Metric | UMAP | PCA |
|---|---|---|
| Overlap between 3D and text-space nearest neighbors | 0.44 | 0.17 |
| Connected-pair distance relative to random pairs | 0.22× | 0.50× |

PCA is used only as a fallback if UMAP is unavailable. Low-confidence records
are placed on an outer shell (radius 2.4) and hidden by default, so they do not
distort the layout.

Proximity on the map reflects general topical similarity. Edges are the stricter
signal: two nearby projects may have no edge between them if they fail the
criteria above.

## Theme clusters

Clusters are labelled only where projects form a genuinely tight group. Average-linkage clustering
on cosine distance (cut at 0.88) is applied, and a cluster is kept only if it
has at least 5 projects with a mean pairwise cosine of at least 0.14, the same
floor used for edges. In the reference corpus about 18 clusters (around 150
projects) qualify, with internal similarity of 0.14–0.25 against a background
median of 0.021. All other projects remain unlabelled.

K-means with 12 clusters was evaluated and rejected: it produced a 61-project
cluster with internal similarity of 0.037, no better than random pairs.

Clusters are moved apart as rigid groups so overlapping themes remain legible,
without changing their internal structure.

## Example connections

| Projects | Shared terms |
|---|---|
| EcoGen and Green Roast | carbon, carbon footprint, energy |
| Heaven's Kitchen and Verde / SafeBites | dietary restrictions, recipe, ingredients |
| 0-Chrono and Solyd | clinical, knowledge graph, patient |
| LaTalk and blue | Mentra glasses, note taking, speech |
| Nothole and Track Stars | ultrasonic sensor, Arduino, accelerometer |
