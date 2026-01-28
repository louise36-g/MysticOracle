# Horseshoe Spreads Design

> **For Claude:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add 20 themed layouts to the 7-card Horseshoe spread, organized into 5 categories with an accordion UI matching the existing 5-card spread pattern.

**Architecture:** Follow the same pattern as `fiveCardLayouts.ts` - category configs with icons/colors, layout definitions with custom positions, accordion-based selection UI in `SpreadIntroSelector.tsx`.

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS, Lucide icons

---

## Categories

| Category | ID | Icon | Color | Layouts |
|----------|-----|------|-------|---------|
| Love & Relationships | `love` | Heart | rose | 4 |
| Career & Work | `career` | Briefcase | blue | 4 |
| Money & Finances | `money` | Coins | amber | 4 |
| Life Path & Major Decisions | `life_path` | Compass | purple | 4 |
| Family & Personal | `family` | Users | teal | 4 |

---

## Category 1: Love & Relationships

### 1.1 New Connection (`new_connection`)
*"Exploring a new connection or wondering about compatibility? This spread reveals what each person brings, hidden dynamics, and the relationship's potential."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | What you bring to this connection | Ce que vous apportez à cette connexion |
| 2 | What they bring to this connection | Ce qu'ils apportent à cette connexion |
| 3 | The energy between you | L'énergie entre vous |
| 4 | Hidden factors at play | Facteurs cachés en jeu |
| 5 | External influences on this potential | Influences extérieures sur ce potentiel |
| 6 | Guidance for moving forward | Guidance pour avancer |
| 7 | What this connection could become | Ce que cette connexion pourrait devenir |

### 1.2 Relationship Check-In (`relationship_checkin`)
*"Take the pulse of a partnership. Understand what's working, what needs attention, and how to nurture the bond."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | The foundation built together | Les fondations construites ensemble |
| 2 | Current state of the relationship | État actuel de la relation |
| 3 | What remains unspoken | Ce qui reste non-dit |
| 4 | Challenges to address | Défis à relever |
| 5 | Outside pressures on the bond | Pressions extérieures sur le lien |
| 6 | How to strengthen connection | Comment renforcer la connexion |
| 7 | The relationship's potential | Le potentiel de la relation |

### 1.3 Relationship Troubles (`relationship_troubles`)
*"When conflict or distance arises, this spread helps reveal root causes, both perspectives, and a path toward resolution."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | How things reached this point | Comment les choses en sont arrivées là |
| 2 | The current tension | La tension actuelle |
| 3 | What's really going on beneath | Ce qui se passe vraiment en profondeur |
| 4 | One perspective on the difficulty | Une perspective sur la difficulté |
| 5 | The other perspective | L'autre perspective |
| 6 | What would help heal this | Ce qui aiderait à guérir cela |
| 7 | Possible resolution | Résolution possible |

### 1.4 Breakup & Moving On (`breakup_moving_on`)
*"Processing a breakup or wondering about an ex? Gain clarity on what happened, what's being held onto, and the path forward."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | What led to the ending | Ce qui a mené à la fin |
| 2 | The current emotional landscape | Le paysage émotionnel actuel |
| 3 | What hasn't been processed | Ce qui n'a pas été traité |
| 4 | What's keeping things stuck | Ce qui maintient les choses bloquées |
| 5 | What this person represents | Ce que cette personne représente |
| 6 | What needs to be released | Ce qui doit être libéré |
| 7 | The heart's next chapter | Le prochain chapitre du cœur |

---

## Category 2: Career & Work

### 2.1 Career Crossroads (`career_crossroads`)
*"Evaluating your current role or considering a change? Understand what's working, what's not, and the path toward fulfillment."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | The career journey so far | Le parcours professionnel jusqu'ici |
| 2 | Current feelings about this work | Sentiments actuels envers ce travail |
| 3 | What's fulfilling vs. what's draining | Ce qui nourrit vs. ce qui épuise |
| 4 | What's blocking progress or satisfaction | Ce qui bloque le progrès ou la satisfaction |
| 5 | Workplace dynamics at play | Dynamiques professionnelles en jeu |
| 6 | Guidance for the next step | Guidance pour la prochaine étape |
| 7 | Likely outcome if changes are made | Issue probable si des changements sont faits |

### 2.2 Career Direction & Purpose (`career_purpose`)
*"Feeling lost or questioning the path? Discover what truly drives fulfillment and whether current work aligns with a deeper calling."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | Skills and experiences present | Compétences et expériences présentes |
| 2 | The current relationship with work | La relation actuelle avec le travail |
| 3 | What the soul craves professionally | Ce que l'âme désire professionnellement |
| 4 | Fears that may be present | Peurs qui peuvent être présentes |
| 5 | Opportunities that may be overlooked | Opportunités qui peuvent être négligées |
| 6 | How to align work with purpose | Comment aligner travail et vocation |
| 7 | Professional potential | Potentiel professionnel |

### 2.3 Workplace Conflicts (`workplace_conflicts`)
*"Navigating difficult colleagues or challenging dynamics? See beneath the surface and find strategies to protect peace and progress."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | How this situation developed | Comment cette situation s'est développée |
| 2 | The current dynamic | La dynamique actuelle |
| 3 | What's really driving the conflict | Ce qui alimente vraiment le conflit |
| 4 | Blind spots in this situation | Angles morts dans cette situation |
| 5 | The other perspective | L'autre perspective |
| 6 | How to navigate this wisely | Comment naviguer cela sagement |
| 7 | Understanding the guidance | Comprendre la guidance |

### 2.4 Starting a Business (`starting_business`)
*"Ready to launch a new venture? This spread reveals readiness, challenges ahead, and what will help it succeed."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | Experience to build on | Expérience sur laquelle bâtir |
| 2 | Current readiness | Préparation actuelle |
| 3 | Hidden strengths or resources | Forces ou ressources cachées |
| 4 | Obstacles to prepare for | Obstacles à anticiper |
| 5 | Market and external factors | Marché et facteurs externes |
| 6 | Key to making this work | Clé pour réussir |
| 7 | The venture's potential | Le potentiel de l'entreprise |

---

## Category 3: Money & Finances

### 3.1 Financial Stability (`financial_stability`)
*"Seeking security with money? Understand the current foundation, what strengthens or weakens it, and how to build lasting stability."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | Financial patterns from the past | Schémas financiers du passé |
| 2 | The current financial picture | La situation financière actuelle |
| 3 | Hidden factors affecting the flow | Facteurs cachés affectant le flux |
| 4 | What threatens stability | Ce qui menace la stabilité |
| 5 | Resources and support available | Ressources et soutien disponibles |
| 6 | Actions to strengthen the foundation | Actions pour renforcer les fondations |
| 7 | Potential for security | Potentiel de sécurité |

### 3.2 Blocks to Abundance (`abundance_blocks`)
*"Feeling stuck around money? Uncover deep-seated beliefs, fears, or patterns that may be limiting the flow of prosperity."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | Early messages received about money | Messages reçus tôt sur l'argent |
| 2 | The current relationship with abundance | La relation actuelle avec l'abondance |
| 3 | Limiting beliefs operating beneath | Croyances limitantes en jeu |
| 4 | How these blocks manifest | Comment ces blocages se manifestent |
| 5 | What abundance truly means here | Ce que l'abondance signifie vraiment ici |
| 6 | How to begin shifting the energy | Comment commencer à changer l'énergie |
| 7 | What becomes possible when released | Ce qui devient possible une fois libéré |

### 3.3 Money Decisions (`money_decisions`)
*"Facing a financial choice? Weigh the factors, understand the risks, and find clarity on the path forward."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | What led to this decision point | Ce qui a mené à ce point de décision |
| 2 | The current financial standing | La situation financière actuelle |
| 3 | What hasn't been fully considered | Ce qui n'a pas été pleinement considéré |
| 4 | Risks to be aware of | Risques à connaître |
| 5 | External factors at play | Facteurs externes en jeu |
| 6 | Guidance for this choice | Guidance pour ce choix |
| 7 | Likely outcome if proceeding | Issue probable si on avance |

### 3.4 Debt & Financial Recovery (`financial_recovery`)
*"Working through debt or financial hardship? This spread brings compassion and clarity to the path toward recovery."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | How this situation arose | Comment cette situation est apparue |
| 2 | The current weight being carried | Le poids actuel porté |
| 3 | Emotions present in this situation | Émotions présentes dans cette situation |
| 4 | What's making recovery harder | Ce qui rend la récupération plus difficile |
| 5 | Support and resources to draw on | Soutien et ressources à solliciter |
| 6 | The next step forward | La prochaine étape |
| 7 | Potential for healing and renewal | Potentiel de guérison et renouveau |

---

## Category 4: Life Path & Major Decisions

### 4.1 Am I On The Right Path? (`right_path`)
*"Doubting the direction of life? This spread offers perspective on where things stand, what's aligned, and what may need adjustment."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | The path that led here | Le chemin qui a mené ici |
| 2 | Where things stand now | Où en sont les choses maintenant |
| 3 | What the soul is truly seeking | Ce que l'âme cherche vraiment |
| 4 | What feels misaligned | Ce qui semble désaligné |
| 5 | Signs and synchronicities present | Signes et synchronicités présents |
| 6 | How to reconnect with inner guidance | Comment se reconnecter à la guidance intérieure |
| 7 | What alignment could look like | À quoi l'alignement pourrait ressembler |

### 4.2 Major Life Transitions (`life_transitions`)
*"Navigating a significant change? Understand what's ending, what's emerging, and how to move through the threshold with grace."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | What needs to be left behind | Ce qui doit être laissé derrière |
| 2 | The current threshold | Le seuil actuel |
| 3 | Emotions arising in this transition | Émotions qui surgissent dans cette transition |
| 4 | What makes this transition difficult | Ce qui rend cette transition difficile |
| 5 | Support available during this time | Soutien disponible pendant cette période |
| 6 | How to honour this passage | Comment honorer ce passage |
| 7 | What's emerging on the other side | Ce qui émerge de l'autre côté |

### 4.3 Major Decisions (`major_decisions`)
*"Facing a significant choice or considering a move? Explore the options, uncover hidden factors, and find clarity on the path forward."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | How this decision point arose | Comment ce point de décision est apparu |
| 2 | What the current situation offers | Ce que la situation actuelle offre |
| 3 | What the new path offers | Ce que le nouveau chemin offre |
| 4 | What's not being seen clearly | Ce qui n'est pas vu clairement |
| 5 | External factors influencing the choice | Facteurs externes influençant le choix |
| 6 | What the heart truly wants | Ce que le cœur veut vraiment |
| 7 | Guidance for deciding | Guidance pour décider |

### 4.4 What's Ahead (`whats_ahead`)
*"Seeking a general life overview? This spread illuminates current energies, upcoming influences, and guidance for the journey ahead."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | Recent experiences shaping now | Expériences récentes qui façonnent le présent |
| 2 | The current life energy | L'énergie de vie actuelle |
| 3 | What's working beneath the surface | Ce qui œuvre sous la surface |
| 4 | Challenges on the horizon | Défis à l'horizon |
| 5 | Opportunities approaching | Opportunités qui approchent |
| 6 | Guidance for the coming period | Guidance pour la période à venir |
| 7 | The overall direction unfolding | La direction générale qui se déploie |

---

## Category 5: Family & Personal Relationships

### 5.1 Family Dynamics (`family_dynamics`)
*"Navigating complex family relationships? This spread illuminates patterns, tensions, and pathways toward greater understanding."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | Family patterns from the past | Schémas familiaux du passé |
| 2 | The current family dynamic | La dynamique familiale actuelle |
| 3 | Unspoken tensions or expectations | Tensions ou attentes non-dites |
| 4 | What's causing friction | Ce qui cause des frictions |
| 5 | Your unmet needs | Vos besoins non satisfaits |
| 6 | How to bring more harmony | Comment apporter plus d'harmonie |
| 7 | Potential for healing | Potentiel de guérison |

### 5.2 Children & Parenting (`parenting`)
*"Questions about children or the parenting journey? Gain insight into the relationship, challenges, and how to nurture connection."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | The foundation of this bond | Les fondations de ce lien |
| 2 | The current parent-child dynamic | La dynamique parent-enfant actuelle |
| 3 | What the child may need | Ce dont l'enfant peut avoir besoin |
| 4 | Challenges in the relationship | Défis dans la relation |
| 5 | External pressures on the family | Pressions extérieures sur la famille |
| 6 | How to deepen understanding | Comment approfondir la compréhension |
| 7 | The relationship's potential | Le potentiel de la relation |

### 5.3 Friendships (`friendships`)
*"Reflecting on a friendship? Explore the connection's health, what it offers, and whether it still serves both people."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | How this friendship began | Comment cette amitié a commencé |
| 2 | The current state of the bond | L'état actuel du lien |
| 3 | What this friendship provides | Ce que cette amitié apporte |
| 4 | What may be straining it | Ce qui peut la fragiliser |
| 5 | The other person's experience | L'expérience de l'autre personne |
| 6 | How to nurture or release | Comment nourrir ou lâcher prise |
| 7 | Where this friendship is heading | Où cette amitié se dirige |

### 5.4 Difficult Relatives (`difficult_relatives`)
*"Struggling with a challenging family member? Understand the deeper dynamics at play and find peace within the situation."*

| Position | Card Meaning (EN) | Card Meaning (FR) |
|----------|-------------------|-------------------|
| 1 | History of this relationship | Histoire de cette relation |
| 2 | The current tension | La tension actuelle |
| 3 | What drives their behaviour | Ce qui motive leur comportement |
| 4 | Triggers present in this dynamic | Déclencheurs présents dans cette dynamique |
| 5 | Boundaries that may be needed | Limites qui peuvent être nécessaires |
| 6 | How to protect inner peace | Comment protéger la paix intérieure |
| 7 | What acceptance could look like | À quoi l'acceptation pourrait ressembler |

---

## Implementation Notes

### Files to Create/Modify

1. **Create:** `constants/horseshoeLayouts.ts`
   - Type definitions: `HorseshoeCategory`, `HorseshoeLayoutId`, `HorseshoeLayout`, `HorseshoeCategoryConfig`
   - Export: `HORSESHOE_LAYOUTS`, `HORSESHOE_CATEGORIES`

2. **Modify:** `components/reading/phases/SpreadIntroSelector.tsx`
   - Add horseshoe spread handling with accordion UI
   - Import horseshoe layouts and categories

3. **Modify:** `types.ts` (if needed)
   - Add any shared types for horseshoe spreads

### UI Pattern

Follow the existing 5-card accordion pattern:
- 5 category accordions (Love, Career, Money, Life Path, Family)
- Each expands to show 4 layouts
- Layout cards show: label, tagline, collapsible positions list
- Selected layout highlighted with category color

### Design Principles Applied

- **CNV/Neutral phrasing:** Positions avoid accusatory "you" language where possible
- **Guidance-oriented:** Final positions focus on potential, not fixed outcomes
- **Non-divinatory:** Tarot offers insight and understanding, not fortune-telling
- **Consistent UX:** Same accordion pattern as 5-card spreads

---

## Preformed Questions (63 total)

Layout-specific introspective questions. Combined layouts have 4 questions; others have 3.

### Category 1: Love & Relationships

**New Connection** (4 questions)
| # | EN | FR |
|---|----|----|
| 1 | What do I need to understand about what's drawing me to this person? | Que dois-je comprendre sur ce qui m'attire vers cette personne? |
| 2 | What am I hoping to find in this connection? | Qu'est-ce que j'espère trouver dans cette connexion? |
| 3 | What qualities am I truly seeking in a partner? | Quelles qualités est-ce que je recherche vraiment chez un partenaire? |
| 4 | How can I remain open without losing myself in this? | Comment puis-je rester ouvert(e) sans me perdre dans cette relation? |

**Relationship Check-In** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | How can I show up more fully in this relationship? | Comment puis-je m'investir plus pleinement dans cette relation? |
| 2 | What am I longing for that I haven't yet expressed? | Qu'est-ce que je désire mais que je n'ai pas encore exprimé? |
| 3 | What truth about this relationship is asking for my attention? | Quelle vérité sur cette relation demande mon attention? |

**Relationship Troubles** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What are the obstacles in this relationship? | Quels sont les obstacles dans cette relation? |
| 2 | What do I need to understand about this situation? | Que dois-je comprendre de cette situation? |
| 3 | What do I need to see clearly about this relationship? | Que dois-je voir clairement dans cette relation? |

**Breakup & Moving On** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What does my heart need most right now? | De quoi mon cœur a-t-il le plus besoin en ce moment? |
| 2 | What am I trying to hold on to? | À quoi est-ce que j'essaie de m'accrocher? |
| 3 | What am I carrying that was never mine to hold? | Qu'est-ce que je porte qui ne m'a jamais appartenu? |

### Category 2: Career & Work

**Career Crossroads** (4 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is my work trying to teach me right now? | Qu'est-ce que mon travail essaie de m'apprendre en ce moment? |
| 2 | What part of me feels unfulfilled in my current role? | Quelle partie de moi se sent insatisfaite dans mon rôle actuel? |
| 3 | What am I afraid to admit about my career? | Qu'est-ce que j'ai peur d'admettre sur ma carrière? |
| 4 | What would it mean to feel truly aligned in my work? | Que signifierait être vraiment aligné(e) dans mon travail? |

**Career Direction & Purpose** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is my soul calling me toward professionally? | Vers quoi mon âme m'appelle-t-elle professionnellement? |
| 2 | What gifts do I have that are asking to be expressed? | Quels dons ai-je qui demandent à être exprimés? |
| 3 | What beliefs about success are no longer serving me? | Quelles croyances sur le succès ne me servent plus? |

**Workplace Conflicts** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is this conflict revealing about my boundaries? | Que révèle ce conflit sur mes limites? |
| 2 | What part of me is being triggered in this situation? | Quelle partie de moi est déclenchée dans cette situation? |
| 3 | How can I find peace without abandoning my needs? | Comment puis-je trouver la paix sans abandonner mes besoins? |

**Starting a Business** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is truly motivating me to take this leap? | Qu'est-ce qui me motive vraiment à faire ce saut? |
| 2 | What fears do I need to face before moving forward? | Quelles peurs dois-je affronter avant d'avancer? |
| 3 | What does my vision need from me right now? | De quoi ma vision a-t-elle besoin de moi en ce moment? |

### Category 3: Money & Finances

**Financial Stability** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What does true security mean to me beyond money? | Que signifie la vraie sécurité pour moi au-delà de l'argent? |
| 2 | What patterns around money did I inherit that need examining? | Quels schémas autour de l'argent ai-je hérités qui méritent examen? |
| 3 | What would help me trust myself more with finances? | Qu'est-ce qui m'aiderait à me faire plus confiance avec les finances? |

**Blocks to Abundance** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What beliefs about money am I ready to release? | Quelles croyances sur l'argent suis-je prêt(e) à libérer? |
| 2 | Where in my life am I blocking my own flow? | Où dans ma vie est-ce que je bloque mon propre flux? |
| 3 | What would I do differently if I truly believed I was worthy of abundance? | Que ferais-je différemment si je croyais vraiment mériter l'abondance? |

**Money Decisions** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is this financial decision really about for me? | De quoi s'agit-il vraiment pour moi dans cette décision financière? |
| 2 | What am I afraid of losing if I choose wrong? | De quoi ai-je peur si je fais le mauvais choix? |
| 3 | What does my intuition already know about this choice? | Que sait déjà mon intuition sur ce choix? |

**Debt & Financial Recovery** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What emotions around this situation need my compassion? | Quelles émotions autour de cette situation ont besoin de ma compassion? |
| 2 | What is this experience teaching me about my relationship with money? | Que m'apprend cette expérience sur ma relation avec l'argent? |
| 3 | What small step forward can I honour myself for taking? | Quel petit pas en avant puis-je m'honorer d'avoir fait? |

### Category 4: Life Path & Major Decisions

**Am I On The Right Path?** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is my life trying to show me right now? | Qu'est-ce que ma vie essaie de me montrer en ce moment? |
| 2 | Where am I seeking external validation instead of trusting myself? | Où est-ce que je cherche une validation extérieure au lieu de me faire confiance? |
| 3 | What would alignment feel like in my body and heart? | À quoi ressemblerait l'alignement dans mon corps et mon cœur? |

**Major Life Transitions** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is ending that I need to honour before moving on? | Qu'est-ce qui se termine et que je dois honorer avant de passer à autre chose? |
| 2 | What is being born in me through this change? | Qu'est-ce qui naît en moi à travers ce changement? |
| 3 | How can I be gentle with myself during this passage? | Comment puis-je être doux/douce avec moi-même pendant ce passage? |

**Major Decisions** (4 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is this decision really asking of me? | Que me demande vraiment cette décision? |
| 2 | What am I hoping will change if I choose differently? | Qu'est-ce que j'espère qui changera si je choisis autrement? |
| 3 | What do I need to understand before I can move forward? | Que dois-je comprendre avant de pouvoir avancer? |
| 4 | What would I choose if fear wasn't a factor? | Que choisirais-je si la peur n'était pas un facteur? |

**What's Ahead** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What energies are gathering around me at this time? | Quelles énergies se rassemblent autour de moi en ce moment? |
| 2 | What do I need to pay attention to in the coming period? | À quoi dois-je prêter attention dans la période à venir? |
| 3 | How can I prepare myself for what's unfolding? | Comment puis-je me préparer à ce qui se déploie? |

### Category 5: Family & Personal Relationships

**Family Dynamics** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What role have I been playing in my family that no longer fits? | Quel rôle ai-je joué dans ma famille qui ne me convient plus? |
| 2 | What unspoken expectations am I carrying from my family? | Quelles attentes non-dites est-ce que je porte de ma famille? |
| 3 | How can I honour my roots while still becoming my own person? | Comment puis-je honorer mes racines tout en devenant ma propre personne? |

**Children & Parenting** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is my child teaching me about myself? | Que m'apprend mon enfant sur moi-même? |
| 2 | Where am I parenting from fear rather than love? | Où est-ce que je parente par peur plutôt que par amour? |
| 3 | How can I be more present to what my child truly needs? | Comment puis-je être plus présent(e) à ce dont mon enfant a vraiment besoin? |

**Friendships** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What am I seeking from this friendship that I could also give myself? | Qu'est-ce que je cherche dans cette amitié que je pourrais aussi me donner? |
| 2 | How have I changed, and does this friendship still reflect who I am? | Comment ai-je changé, et cette amitié reflète-t-elle encore qui je suis? |
| 3 | What truth about this connection am I avoiding? | Quelle vérité sur cette connexion est-ce que j'évite? |

**Difficult Relatives** (3 questions)
| # | EN | FR |
|---|----|----|
| 1 | What is this person triggering in me that needs healing? | Qu'est-ce que cette personne déclenche en moi qui a besoin de guérison? |
| 2 | What boundaries would protect my peace without closing my heart? | Quelles limites protégeraient ma paix sans fermer mon cœur? |
| 3 | What would acceptance look like in this situation? | À quoi ressemblerait l'acceptation dans cette situation? |

---

## Question Design Principles

- **Introspective focus:** Questions turn attention inward, not toward predicting external events
- **Self-understanding:** Each question invites deeper self-knowledge
- **Non-judgmental:** Phrasing avoids blame or shame
- **Open-ended:** Questions cannot be answered with yes/no
- **Empowering:** Questions assume the querent has inner wisdom to access
