import type { SATModule, SATModuleId, SATQuestion, SATSection } from './practiceTest4'
import type { SATStructuredChoice } from './practiceTest4QuestionCorrections'

type Difficulty = SATQuestion['difficulty']
type DraftQuestion = {
  prompt: string
  kind: SATQuestion['kind']
  correctAnswer: string
  acceptedAnswers?: string[]
  tolerance?: number
  choices: SATStructuredChoice[]
  domain: string
  skill: string
  difficulty: Difficulty
  explanation: string
}

const choices = (a: string, b: string, c: string, d: string): SATStructuredChoice[] => [
  { key: 'A', text: a },
  { key: 'B', text: b },
  { key: 'C', text: c },
  { key: 'D', text: d },
]

const mc = (
  domain: string,
  skill: string,
  difficulty: Difficulty,
  prompt: string,
  answer: 'A' | 'B' | 'C' | 'D',
  answerChoices: [string, string, string, string],
  explanation: string,
): DraftQuestion => ({
  prompt,
  kind: 'multiple-choice',
  correctAnswer: answer,
  choices: choices(...answerChoices),
  domain,
  skill,
  difficulty,
  explanation,
})

const spr = (
  domain: string,
  skill: string,
  difficulty: Difficulty,
  prompt: string,
  acceptedAnswers: string[],
  explanation: string,
  tolerance?: number,
): DraftQuestion => ({
  prompt,
  kind: 'student-response',
  correctAnswer: acceptedAnswers[0],
  acceptedAnswers,
  tolerance,
  choices: [],
  domain,
  skill,
  difficulty,
  explanation,
})

const RW1: DraftQuestion[] = [
  mc('Craft and Structure', 'Words in Context', 'Foundation', `A city library received a collection of letters written by local residents during the 1940s. Because the paper is fragile, the archivists have **reserved** the original letters for supervised research while making digital copies available to everyone.

As used in the text, what does "reserved" most nearly mean?`, 'B', ['Ordered in advance', 'Set aside', 'Spoken cautiously', 'Celebrated publicly'], `"Reserved" means set aside for a particular use. The originals are kept for supervised research, while the copies are available more broadly.`),
  mc('Craft and Structure', 'Words in Context', 'Foundation', `Mangrove roots slow the movement of coastal water and trap sediment. In this way, mangrove forests can **sustain** shorelines that would otherwise erode quickly during storms.

Which choice completes the text with the most logical and precise word or phrase?`, 'C', ['measure', 'replace', 'support', 'locate'], `The roots help shorelines continue to exist by limiting erosion, so "support" is the most precise choice. The other choices do not express preservation of the shoreline.`),
  mc('Craft and Structure', 'Words in Context', 'Medium', `Economist Lina Ortega described the early results as **qualified**: employment had risen, but only in two of the six regions included in the study.

As used in the text, what does "qualified" most nearly mean?`, 'A', ['Limited by reservations', 'Certified for a position', 'Made easier to understand', 'Supported by every result'], `The colon explains that the positive result has an important limitation. Thus "qualified" means limited by reservations, not professionally certified.`),
  mc('Craft and Structure', 'Words in Context', 'Medium', `Although the committee praised the proposal's ambition, several members worried about its cost. Their response was therefore ______ rather than uniformly enthusiastic.

Which choice completes the text with the most logical and precise word or phrase?`, 'D', ['indifferent', 'unanimous', 'dismissive', 'ambivalent'], `The members saw both a strength and a weakness, so their reaction contained mixed feelings. "Ambivalent" precisely expresses that combination.`),
  mc('Craft and Structure', 'Text Structure and Purpose', 'Foundation', `To study how bees navigate, biologist Wen Li placed artificial flowers at several distances from a hive. She then changed one feature at a time, such as the flowers' color or scent. This design allowed Li to identify which signals the bees relied on most.

Which choice best describes the function of the second sentence?`, 'C', ['It reports the study’s final numerical result.', 'It introduces a criticism of Li’s conclusion.', 'It explains a key feature of Li’s experimental method.', 'It describes how other scientists repeated the study.'], `The second sentence tells how Li varied one feature at a time, a central part of the experimental design. It does not give results or discuss another study.`),
  mc('Craft and Structure', 'Text Structure and Purpose', 'Medium', `Historian Amara Bell examines household account books from the eighteenth century. Such records rarely state what family members thought, but they list purchases, debts, and wages. Bell uses those details to reconstruct how ordinary families responded to changing food prices.

Which choice best states the main purpose of the text?`, 'B', ['To argue that account books are more accurate than all other historical records', 'To explain how a historian uses routine financial records to study family life', 'To show that eighteenth-century families kept records mainly for historians', 'To compare food prices in several modern cities'], `The passage introduces Bell's source, notes its limitation, and explains how she uses it. Choice B captures that complete purpose without making an unsupported claim.`),
  mc('Craft and Structure', 'Cross-Text Connections', 'Medium', `**Text 1**
Researcher Dalia Noor argues that urban rooftop gardens should be evaluated mainly by the food they produce. A garden that yields little food, she says, is an inefficient use of limited roof space.

**Text 2**
Researcher Evan Cho found that even low-yield rooftop gardens lowered nearby roof temperatures and provided habitat for insects.

Based on the texts, how would Cho most likely respond to Noor's claim?`, 'D', ['By agreeing that every rooftop garden produces the same amount of food', 'By arguing that roof space should never be used for gardens', 'By claiming that insect habitat always increases food production', 'By noting that rooftop gardens can provide benefits not measured by food yield'], `Cho identifies cooling and habitat benefits even when food yield is low. He would therefore challenge evaluating gardens only by food production.`),
  mc('Craft and Structure', 'Text Structure and Purpose', 'Advanced', `Poet Gwendolyn Bennett's reviews often begin by describing a work's most impressive feature. She then shifts to a measured discussion of its limitations. This pattern does not weaken her praise; rather, it establishes the standards by which that praise should be understood.

Which choice best describes the function of the final sentence?`, 'A', ['It clarifies how the reviews’ discussion of limitations affects the meaning of their praise.', 'It suggests that Bennett eventually stopped writing reviews.', 'It provides an example of a limitation Bennett identified in one poem.', 'It argues that Bennett’s standards were less demanding than those of other reviewers.'], `The final sentence interprets the pattern described earlier: criticism qualifies and frames Bennett's praise rather than canceling it. No career change, specific poem, or comparison appears.`),

  mc('Information and Ideas', 'Central Ideas and Details', 'Foundation', `When engineer Sora Kim tested a new window coating, rooms with coated windows remained cooler during sunny afternoons than rooms with ordinary windows. The coating also allowed nearly the same amount of visible light to enter. Kim concluded that the material could reduce cooling needs without making indoor spaces noticeably darker.

Which choice best states the main idea of the text?`, 'A', ['A window coating may reduce indoor heat while preserving visible light.', 'Ordinary windows block more visible light than all coated windows.', 'Cooling systems work only when windows are made darker.', 'Kim designed a coating mainly to change the color of sunlight.'], `The text reports both key findings—less heat and nearly unchanged visible light—and the practical conclusion. Choice A combines those points accurately.`),
  mc('Information and Ideas', 'Central Ideas and Details', 'Foundation', `Archaeologists studying a port found ceramic jars from several distant regions. Many jars contained traces of olive oil, while others held residues of fish sauce. The variety of origins and contents indicates that the port participated in multiple trade networks.

According to the text, what did the archaeologists find in some of the jars?`, 'C', ['Cotton fibers', 'Iron tools', 'Traces of olive oil', 'Fresh grain'], `The passage directly states that many jars contained traces of olive oil. The other materials are not mentioned.`),
  mc('Information and Ideas', 'Inferences', 'Medium', `Some desert plants open their leaf pores at night rather than during the day. At night, temperatures are lower and the air is often more humid, so less water escapes while the plants take in carbon dioxide.

Which conclusion is best supported by the text?`, 'B', ['The plants require no carbon dioxide during daylight.', 'Opening pores at night helps the plants conserve water.', 'Desert air is always humid after sunset.', 'The plants grow only when nighttime temperatures fall below freezing.'], `The text links nighttime pore opening to reduced water loss. It does not say that carbon dioxide is unnecessary by day or make absolute claims about humidity or freezing.`),
  mc('Information and Ideas', 'Command of Evidence: Textual', 'Medium', `A student claims that composer Florence Price continued revising major works even after they had been performed publicly.

Which finding, if true, would most directly support the claim?`, 'D', ['Price owned printed scores by several European composers.', 'A newspaper praised the first performance of one of Price’s symphonies.', 'Price wrote music for both orchestras and solo instruments.', 'A manuscript contains changes in Price’s handwriting dated two years after its premiere.'], `Handwritten revisions dated after the premiere directly demonstrate continued revision following public performance. The other findings do not establish later changes.`),
  mc('Information and Ideas', 'Command of Evidence: Quantitative', 'Medium', `A greenhouse study recorded the average height of bean plants after four weeks.

No fertilizer: 18 cm
Fertilizer L: 25 cm
Fertilizer M: 22 cm
Fertilizer N: 16 cm

Which choice most effectively uses the data to support the claim that not every fertilizer improved growth?`, 'A', ['Plants given fertilizer N averaged 2 cm shorter than plants given no fertilizer.', 'Plants given fertilizer L averaged 7 cm taller than plants given no fertilizer.', 'Plants given fertilizer M averaged 3 cm taller than plants given no fertilizer.', 'The three fertilizer groups had different average heights.'], `Fertilizer N produced an average of 16 cm versus 18 cm with no fertilizer, directly showing a fertilizer that did not improve growth.`),
  mc('Information and Ideas', 'Inferences', 'Advanced', `A linguist compared recordings of the same speakers telling a story to friends and to unfamiliar interviewers. Most speakers paused more often with interviewers, but their total speaking time changed little. The linguist cautioned that pause frequency alone should not be treated as evidence that a speaker has less to say.

Which conclusion is most logically supported?`, 'C', ['Speakers always tell longer stories to friends.', 'Interviewers caused speakers to forget the story.', 'A change in conversational setting can affect delivery without substantially changing amount of speech.', 'Pause frequency is unrelated to conversational setting.'], `The recordings show more pauses in one setting but similar total speaking time. This supports a change in delivery, not in the overall amount spoken.`),
  mc('Information and Ideas', 'Inferences', 'Advanced', `Ecologists expected a fenced meadow to contain more young trees because deer could not browse there. Ten years later, tree seedlings were indeed more numerous inside the fence, but few had grown taller than surrounding grasses. Dense grass cover, which also increased after fencing, may have limited the seedlings' access to light.

Which choice most logically completes the account?`, 'B', ['Preventing browsing necessarily causes forests to mature rapidly.', 'Removing one constraint on tree growth can strengthen another constraint.', 'Deer are the only animals that affect meadow vegetation.', 'Grass cover decreases whenever tree seedlings become more numerous.'], `The fence reduced browsing but promoted dense grass, which may have limited light. The result shows that easing one constraint can intensify another.`),

  mc('Standard English Conventions', 'Form, Structure, and Sense', 'Foundation', `To help beginners build research skills, the university offers short practical classes each spring. A series of workshops on digital mapping ______ available to all first-year students.`, 'C', ['are', 'were being', 'is', 'have been'], `The subject is the singular noun "series," so the singular verb "is" is required. The phrase "of workshops" does not control agreement.`),
  mc('Standard English Conventions', 'Form, Structure, and Sense', 'Foundation', `The laboratory recently acquired two microscopes for its undergraduate courses. The instruments differ in resolution, but ______ can reveal structures too small to see with the unaided eye.`, 'B', ['it', 'both', 'either one are', 'them'], `"Both" correctly refers to the plural noun "instruments" and serves as the subject of "can reveal." The other options create agreement or case errors.`),
  mc('Standard English Conventions', 'Boundaries', 'Medium', `To assess mobility before redesigning the bus network, researchers conducted two complementary studies. The first survey measured residents' travel habits ______ the second examined their access to public transportation.`, 'D', [',', 'and', ':', ';'], `The sentence contains two independent clauses. A semicolon correctly joins them without a coordinating conjunction.`),
  mc('Standard English Conventions', 'Boundaries', 'Medium', `Curators devoted the final gallery to materials recovered from a remote mountain camp. The museum displayed three objects from the expedition ______ a compass, a field notebook, and a brass telescope.`, 'A', [':', ',', ';', ' and'], `A colon appropriately introduces a list after the complete independent clause. A comma alone cannot perform that function here.`),
  mc('Standard English Conventions', 'Form, Structure, and Sense', 'Medium', `Maya's ecology class visited a wetland recently restored from farmland that had long been abandoned. Walking along a newly built path through the wetland, ______.`, 'C', ['several herons were visible to Maya', 'the calls of frogs surrounded Maya', 'Maya spotted several herons', 'there were several herons Maya could see'], `The introductory phrase must logically modify the person walking. "Maya spotted" places Maya immediately after the modifier and creates a clear sentence.`),
  mc('Standard English Conventions', 'Form, Structure, and Sense', 'Advanced', `During her summer internship at a natural history museum, Priya received training in several essential tasks. She learned how to catalog specimens, operate imaging equipment, and ______ research findings for a general audience.`, 'B', ['the communication of', 'communicate', 'communicating', 'she communicated'], `The series requires parallel base-form verbs: "catalog," "operate," and "communicate." Choice B preserves that structure.`),
  mc('Standard English Conventions', 'Boundaries', 'Advanced', `Before their field survey, the researchers compared two possible hiking routes to the site. The eastern route appeared shorter on the new map ______ however, steep terrain made the actual trip take longer.`, 'D', [',', 'and', ':', ';'], `Two independent clauses joined by the conjunctive adverb "however" require a semicolon before it and a comma after it.`),

  mc('Expression of Ideas', 'Transitions', 'Foundation', `The town converted an unused rail corridor into a walking path. ______, the route now connects two neighborhoods that previously had no direct pedestrian link.`, 'A', ['As a result', 'In contrast', 'For example', 'Nevertheless'], `The new connection is a consequence of converting the corridor, so "As a result" states the relationship clearly.`),
  mc('Expression of Ideas', 'Transitions', 'Medium', `A conservator noted that the two metals have nearly identical appearances, so visual inspection alone cannot reliably distinguish them. ______, their reactions to saltwater are quite different.`, 'C', ['Likewise', 'Therefore', 'However', 'For instance'], `The second sentence contrasts similar appearance with different chemical behavior. "However" signals that contrast.`),
  mc('Expression of Ideas', 'Rhetorical Synthesis', 'Medium', `A student has taken the following notes:

- Botanist Ynes Mexia collected plants throughout the Americas.
- She began her professional collecting career in her fifties.
- Her specimens supported later scientific research.
- Many plant species were named in her honor.

The student wants to emphasize the lasting scientific importance of Mexia's work. Which choice most effectively uses relevant information from the notes?`, 'B', ['Mexia traveled throughout the Americas and began collecting professionally in her fifties.', 'Mexia’s specimens supported later research, and numerous plant species were named in recognition of her work.', 'Mexia was a botanist whose professional career began later than many careers do.', 'Many regions in the Americas contain plant species collected by botanists.'], `Choice B focuses on later research and species named for Mexia, both direct evidence of lasting scientific importance. The other choices emphasize biography or general context.`),
  mc('Expression of Ideas', 'Rhetorical Synthesis', 'Advanced', `A student has taken the following notes:

- City A planted 500 street trees in 2022.
- City B planted 300 street trees in 2022.
- City B spent more per tree because it installed larger tree guards.
- Survival rates after two years were 78% in City A and 91% in City B.

The student wants to compare an apparent trade-off between quantity and survival. Which choice most effectively uses relevant information from the notes?`, 'D', ['Both cities planted street trees in 2022, and City B used large tree guards.', 'City A planted 200 more trees than City B did.', 'City B spent more per tree than City A, although both cities monitored survival.', 'City A planted more trees, but City B’s smaller planting had a higher two-year survival rate.'], `Choice D directly contrasts the larger quantity in City A with the higher survival rate in City B. That comparison expresses the requested trade-off.`),
  mc('Expression of Ideas', 'Transitions', 'Advanced', `The fossil's age initially seemed inconsistent with the rock layer in which it was found. Later analysis showed that groundwater had carried the fossil into a narrow crack from an older layer above. ______, the apparent inconsistency did not require revising the site's geological timeline.`, 'B', ['Similarly', 'Consequently', 'Meanwhile', 'Nevertheless'], `The groundwater explanation resolves the inconsistency; consequently, no timeline revision is needed. The transition marks cause and result.`),
]

const RW2: DraftQuestion[] = [
  mc('Craft and Structure', 'Words in Context', 'Medium', `The research team did not attempt to eliminate every source of uncertainty. Instead, it sought to **constrain** the range of plausible estimates by combining evidence from three independent methods.

As used in the text, what does "constrain" most nearly mean?`, 'C', ['justify', 'display', 'limit', 'predict'], `Combining independent evidence narrows, or limits, the range of plausible estimates. "Constrain" therefore means limit in this context.`),
  mc('Craft and Structure', 'Words in Context', 'Medium', `Because the newly discovered diary includes entries from only two months, it does not ______ the historian's broader account; nevertheless, it offers valuable details about that brief period.

Which choice completes the text with the most logical and precise word or phrase?`, 'A', ['supplant', 'introduce', 'circulate', 'obscure'], `A short diary cannot replace the broader account, so "supplant" is precise. The contrast then explains that the diary still contributes useful detail.`),
  mc('Craft and Structure', 'Words in Context', 'Advanced', `The bright markings on the moth's wings may appear conspicuous to humans, but under the dim forest light they ______ the outline of the moth's body, making its shape harder for predators to detect.

Which choice completes the text with the most logical and precise word or phrase?`, 'D', ['document', 'stabilize', 'replicate', 'disrupt'], `The markings make the moth's body outline harder to perceive, so they "disrupt" that outline. The other verbs do not describe visual camouflage.`),
  mc('Craft and Structure', 'Words in Context', 'Advanced', `Critic Mara Venn calls the novel's ending **provisional** because it resolves the central conflict while leaving open the possibility that the characters' agreement will later collapse.

As used in the text, what does "provisional" most nearly mean?`, 'B', ['Needlessly complicated', 'Subject to change', 'Officially recorded', 'Intentionally secret'], `An agreement that may later collapse is temporary or subject to change. That is the contextual meaning of "provisional."`),
  mc('Craft and Structure', 'Text Structure and Purpose', 'Medium', `Researchers once assumed that a certain frog was silent because observers had never recorded its call. A new study detected low-frequency vibrations produced by the frog's throat. The vibrations travel through leaves rather than through the air, suggesting that the species communicates in a way earlier surveys were not designed to detect.

Which choice best states the main purpose of the text?`, 'C', ['To show that most frogs communicate through leaves', 'To criticize researchers for ignoring visible frog behavior', 'To explain how a finding challenges an earlier assumption about a frog species', 'To compare the throat structures of several frog species'], `The passage contrasts the old assumption of silence with new evidence of vibration-based communication. Choice C captures that reversal.`),
  mc('Craft and Structure', 'Text Structure and Purpose', 'Advanced', `In an essay on public monuments, scholar Reiko Shah first describes how a statue's meaning changed as the neighborhood around it changed. Shah then turns to maintenance records showing repeated alterations to the statue itself. By pairing social history with material evidence, Shah treats the monument not as a fixed object but as an evolving one.

Which choice best describes the organization of the text?`, 'A', ['It presents two kinds of change and explains the interpretation produced by considering them together.', 'It states a theory, rejects all evidence for it, and proposes an unrelated theory.', 'It compares two monuments and identifies which one changed more rapidly.', 'It lists maintenance records before questioning whether the statue exists.'], `The text moves from changing social context to physical alterations, then explains their combined significance. Choice A accurately describes that structure.`),
  mc('Craft and Structure', 'Cross-Text Connections', 'Advanced', `**Text 1**
Astronomer Pilar Sato argues that a planet's unusually low density is best explained by a deep atmosphere rich in light gases.

**Text 2**
Astronomer Leon Briggs notes that measurements of the planet's radius depend on models of its star. Using a revised stellar model, Briggs calculates a smaller planet with an ordinary density.

How would Briggs most likely respond to Sato's explanation?`, 'B', ['The planet’s atmosphere must contain no gases.', 'The proposed atmospheric explanation may be unnecessary if the planet’s radius has been overestimated.', 'Low-density planets cannot orbit stars.', 'The original measurements prove that the revised stellar model is wrong.'], `Briggs's smaller radius yields ordinary density, removing the phenomenon Sato's deep atmosphere was meant to explain. He would therefore question whether that explanation is needed.`),
  mc('Craft and Structure', 'Cross-Text Connections', 'Advanced', `**Text 1**
Historian Niko Alvarez interprets the abrupt decline in imported pottery at Site K as evidence that regional trade collapsed after a drought.

**Text 2**
Historian Salma Idris reports that locally produced pottery increased at Site K during the same period and that imported metal tools remained common.

Based on the texts, which statement would Idris most likely agree with?`, 'D', ['The drought caused all craft production at Site K to stop.', 'Imported pottery was more useful than metal tools.', 'Trade can be measured accurately using pottery alone.', 'The pottery decline may reflect substitution by local goods rather than a total trade collapse.'], `Local pottery replaced some imported pottery while imported tools continued, so the evidence does not show total trade collapse. Choice D gives the most plausible response.`),

  mc('Information and Ideas', 'Central Ideas and Details', 'Medium', `Rather than treating translation as the replacement of each word with an equivalent, translator Hana Okafor attends to rhythm, sentence length, and implied tone. She sometimes changes a sentence's structure to preserve the effect it creates in the original language. For Okafor, fidelity depends on recreating a reading experience, not merely matching vocabulary.

Which choice best states the main idea?`, 'B', ['Okafor believes every sentence has only one accurate translation.', 'Okafor prioritizes preserving a text’s overall effect over literal word matching.', 'Okafor changes sentence structure because she dislikes the original rhythm.', 'Vocabulary is irrelevant to every kind of translation.'], `The passage repeatedly contrasts literal replacement with preservation of rhythm, tone, and effect. Choice B states that central contrast without exaggeration.`),
  mc('Information and Ideas', 'Inferences', 'Medium', `A study compared two groups learning the same set of symbols. One group studied the symbols in a fixed order; the other encountered them in a different order each session. Both groups performed similarly on an immediate test, but the varied-order group performed better one week later.

Which conclusion is best supported?`, 'A', ['Varying study order may improve longer-term retention even when immediate performance is unchanged.', 'Fixed-order study prevents any immediate learning.', 'The varied-order group studied for more total hours.', 'A one-week delay improves everyone’s performance.'], `Only the delayed test separated the groups, favoring varied order. This supports a possible retention benefit, not claims about study time or universal improvement.`),
  mc('Information and Ideas', 'Command of Evidence: Textual', 'Advanced', `A researcher argues that the popularity of an early bicycle design was driven partly by how easily local mechanics could repair it.

Which finding, if true, would most directly support the argument?`, 'C', ['Advertisements described the bicycle as available in three colors.', 'Factory records show that production increased after a new manager arrived.', 'Repair manuals used standard parts already stocked by mechanics in many towns.', 'Riders sometimes used bicycles to travel between towns.'], `Existing local stocks of standard parts would make repairs accessible and directly supports the proposed reason for popularity.`),
  mc('Information and Ideas', 'Command of Evidence: Quantitative', 'Advanced', `Researchers measured the percentage of seeds that germinated under four salt concentrations.

0 grams/liter: 92%
2 grams/liter: 88%
4 grams/liter: 71%
6 grams/liter: 39%

Which choice best supports the claim that the negative effect became especially pronounced above 2 grams per liter?`, 'D', ['Germination was highest at 0 grams per liter.', 'The results include four salt concentrations.', 'Germination fell by 4 percentage points from 0 to 2 grams per liter.', 'Germination fell by 17 points from 2 to 4 grams per liter and by another 32 points from 4 to 6.'], `The much larger declines after 2 grams per liter directly demonstrate that the negative effect becomes more pronounced above that level.`),
  mc('Information and Ideas', 'Inferences', 'Advanced', `In controlled tanks, juvenile fish exposed to boat-engine recordings spent more time near artificial shelters than fish in quiet tanks. Their feeding rates, however, did not differ significantly. The researchers warn that a single behavioral measure may not capture the full effect of noise.

Which conclusion is most logically supported?`, 'C', ['Engine noise prevents juvenile fish from feeding.', 'Artificial shelters eliminate every effect of engine noise.', 'Engine noise altered shelter use without producing a detected change in feeding.', 'Quiet tanks caused fish to avoid shelters.'], `The study detected a shelter-use difference but no significant feeding difference. Choice C states exactly that mixed result.`),
  mc('Information and Ideas', 'Command of Evidence: Textual', 'Advanced', `Literary scholar Ava Mensah argues that a narrator's repeated references to maps reveal growing doubt rather than increasing confidence.

Which quotation from the novel would best support Mensah's argument?`, 'B', ['“I folded the map neatly and placed it beside the compass.”', '“Each time I opened the map, its confident lines seemed less connected to the country before me.”', '“The map was printed in blue ink on thick paper.”', '“My guide owned a map identical to mine.”'], `The map's seemingly confident lines become less trustworthy to the narrator, directly expressing growing doubt. The other quotations are neutral descriptions.`),
  mc('Information and Ideas', 'Inferences', 'Advanced', `After a museum replaced technical object labels with shorter ones, visitors spent less time at each display but visited more displays overall. On exit surveys, visitors recalled approximately the same number of facts as before the change.

Which inference is best supported?`, 'A', ['Shorter labels changed how visitors distributed their attention without reducing measured factual recall.', 'Visitors refused to read any of the shorter labels.', 'Technical labels always cause visitors to remember more facts.', 'The museum removed most objects when it changed the labels.'], `Visitors shifted from longer attention at fewer displays to broader coverage, while recall remained similar. Choice A synthesizes all three findings.`),

  mc('Standard English Conventions', 'Boundaries', 'Medium', `Marine biologist Aisha Grant studies organisms that thrive without sunlight near hydrothermal vents ______ environments once thought too extreme to support the complex ecosystems now documented there.`, 'B', [', they are', ',', ';', ' and they are'], `The phrase after the blank renames "hydrothermal vents" and is nonessential appositive information. A comma correctly introduces it.`),
  mc('Standard English Conventions', 'Form, Structure, and Sense', 'Medium', `The engineers compared several plans before scheduling the laboratory renovation. Neither the revised schedules nor the original timetable ______ enough time for the required equipment inspection.`, 'D', ['allow', 'have allowed', 'were allowing', 'allows'], `With "neither...nor," the verb agrees with the nearer subject, "timetable," which is singular. Therefore "allows" is correct.`),
  mc('Standard English Conventions', 'Boundaries', 'Medium', `Most documents in the collection are handwritten reports or printed maps. The archive also contains one especially unusual item ______ a wax-cylinder recording made during the 1908 expedition.`, 'A', [':', ',', ';', '?'], `A colon introduces the specific item after a complete clause. A comma would create an improper boundary.`),
  mc('Standard English Conventions', 'Form, Structure, and Sense', 'Advanced', `For decades, assistants at the mountain observatory carefully measured and checked stellar coordinates. By the time the observatory published its catalog in 1912, its staff ______ the positions of more than 40,000 stars.`, 'C', ['records', 'has recorded', 'had recorded', 'would record'], `The recording was completed before another past event, the 1912 publication. The past perfect "had recorded" expresses that sequence.`),
  mc('Standard English Conventions', 'Boundaries', 'Advanced', `The research team designed its sensor so that schools with limited budgets could build it locally. The device is inexpensive to manufacture ______ its components can be assembled without specialized tools.`, 'B', [', in fact,', '; in fact,', ': in fact', ' in fact;'], `The clauses on both sides are independent. A semicolon before "in fact" and a comma after it correctly join and punctuate them.`),
  mc('Standard English Conventions', 'Form, Structure, and Sense', 'Advanced', `Judges needed consistent information to evaluate hundreds of images submitted to the historical photography contest. The committee therefore recommended that every submitted photograph ______ accompanied by a statement identifying its date and location.`, 'A', ['be', 'is', 'was', 'has been'], `After a demand or recommendation, formal English uses the subjunctive base form: "recommended that ... be accompanied."`),
  mc('Standard English Conventions', 'Boundaries', 'Advanced', `The agricultural study recorded weather and soil conditions at every test plot. In particular, researchers tracked three variables throughout the growing season ______ soil moisture, canopy cover, and average wind speed.`, 'A', [':', ',', ';', '.'], `The words before the blank form a complete clause, and the words after it identify the three variables. A colon correctly introduces that list.`),

  mc('Expression of Ideas', 'Transitions', 'Medium', `The ceramic fragments were found far from the region where they were manufactured. ______, chemical analysis showed that the clay matched sources near that manufacturing region.

Which choice completes the text with the most logical transition?`, 'D', ['Instead', 'Nevertheless', 'For example', 'Moreover'], `The chemical evidence adds support to the implication of distant origin, so "Moreover" is the logical additive transition.`),
  mc('Expression of Ideas', 'Transitions', 'Advanced', `Small observational studies had suggested that the supplement improved sleep. A large randomized trial found no meaningful difference between the supplement and a placebo. ______, clinicians should be cautious about treating the earlier association as causal.`, 'B', ['Likewise', 'Therefore', 'For instance', 'Meanwhile'], `The randomized trial weakens the causal interpretation of earlier observations. "Therefore" correctly introduces the resulting recommendation.`),
  mc('Expression of Ideas', 'Rhetorical Synthesis', 'Advanced', `A student has taken the following notes:

- Architect Lina Bo Bardi designed the São Paulo Museum of Art.
- Its main gallery is suspended above an open public plaza.
- The design preserves gathering space at street level.
- The suspended structure became a recognizable feature of the city.

The student wants to explain how a structural choice served both civic and symbolic purposes. Which choice most effectively uses relevant information from the notes?`, 'C', ['Bo Bardi designed a museum in São Paulo with a main gallery.', 'The museum’s plaza is located at street level beneath its main gallery.', 'By suspending the gallery, Bo Bardi preserved a public gathering space and created a structure that became a city landmark.', 'The museum became recognizable because many people gathered in São Paulo.'], `Choice C connects the same structural choice to both civic use (public space) and symbolic impact (landmark), exactly fulfilling the goal.`),
  mc('Expression of Ideas', 'Rhetorical Synthesis', 'Advanced', `A student has taken the following notes:

- A 2018 survey recorded 42 bird species in Park R.
- Wetland restoration began in Park R in 2019.
- A 2024 survey recorded 61 bird species.
- The survey methods and seasonal timing were the same.
- The surveys alone cannot prove that restoration caused the increase.

The student wants to present the change while accurately acknowledging a limitation. Which choice most effectively uses relevant information from the notes?`, 'A', ['Using comparable methods, surveys recorded an increase from 42 to 61 species after restoration began, though the surveys alone cannot establish causation.', 'Restoration caused 19 new bird species to move permanently into Park R.', 'The 2024 survey was more reliable because it recorded more species than the 2018 survey.', 'Park R contained exactly 42 species before 2019 and exactly 61 species afterward.'], `Choice A reports the comparable measurements and timing but avoids claiming that the surveys prove causation. The other choices overstate what the data show.`),
  mc('Expression of Ideas', 'Transitions', 'Advanced', `The algorithm performed well on images similar to those in its training set. It was substantially less accurate on images captured under different lighting conditions. ______, high average accuracy did not guarantee reliable performance in every setting.`, 'C', ['Specifically', 'Similarly', 'Thus', 'Meanwhile'], `The final sentence draws a conclusion from the contrast in performance. "Thus" correctly signals that inference.`),
]

const MATH1: DraftQuestion[] = [
  mc('Algebra', 'Linear equations in one variable', 'Foundation', `If $x+7=19$, what is the value of $x$?`, 'C', ['10', '11', '12', '26'], `Subtract 7 from both sides: $x=19-7=12$.`),
  mc('Problem Solving and Data Analysis', 'Percentages', 'Foundation', `A box contains 80 light bulbs. If 15% of the bulbs are LED bulbs, how many LED bulbs are in the box?`, 'B', ['8', '12', '15', '68'], `Convert 15% to 0.15 and multiply: $0.15(80)=12$.`),
  mc('Algebra', 'Linear functions', 'Foundation', `A line passes through $(2,5)$ and $(6,13)$. What is the slope of the line?`, 'A', ['2', '3', '4', '8'], `Slope is change in $y$ divided by change in $x$: $(13-5)/(6-2)=8/4=2$.`),
  mc('Problem Solving and Data Analysis', 'Ratios and proportions', 'Foundation', `The ratio of red beads to blue beads in a bag is $3:5$. If the bag contains 40 beads in total, how many are blue?`, 'D', ['15', '20', '24', '25'], `There are $3+5=8$ equal parts. Each part is $40/8=5$, so the number of blue beads is $5(5)=25$.`),
  mc('Advanced Math', 'Nonlinear functions', 'Foundation', `The function $f$ is defined by $f(x)=2x^2-3$. What is $f(3)$?`, 'B', ['9', '15', '18', '33'], `Substitute 3: $f(3)=2(3^2)-3=18-3=15$.`),
  spr('Algebra', 'Systems of linear equations', 'Foundation', `The equations $x+y=11$ and $x-y=3$ form a system. What is the value of $x$?`, ['7'], `Add the equations to eliminate $y$: $2x=14$. Dividing by 2 gives $x=7$.`),
  mc('Algebra', 'Linear functions', 'Foundation', `In the equation $y=4x-7$, which number is the $y$-intercept of the graph?`, 'C', ['4', '-4', '-7', '7'], `The equation is in slope-intercept form $y=mx+b$. Therefore the $y$-intercept is $b=-7$.`),
  mc('Geometry and Trigonometry', 'Area and perimeter', 'Medium', `A rectangle has length 9 centimeters and perimeter 30 centimeters. What is its area, in square centimeters?`, 'D', ['21', '36', '45', '54'], `From $2(9+w)=30$, $9+w=15$ and $w=6$. The area is $9(6)=54$ square centimeters.`),
  spr('Problem Solving and Data Analysis', 'Measures of center', 'Medium', `The mean of the four numbers $6$, $8$, $10$, and $x$ is $9$. What is the value of $x$?`, ['12'], `A mean of 9 for four numbers requires a sum of $4(9)=36$. Since $6+8+10=24$, $x=36-24=12$.`),
  mc('Algebra', 'Linear equations in context', 'Medium', `A taxi ride costs a fixed fee of 4 dollars plus 2.50 dollars per mile. If a ride costs 29 dollars, how many miles was the ride?`, 'B', ['8', '10', '11.6', '13.2'], `Let $m$ be the miles. Solve $4+2.5m=29$: $2.5m=25$, so $m=10$.`),
  mc('Advanced Math', 'Quadratic equations', 'Medium', `What is the positive solution to $x^2-9=0$?`, 'B', ['-9', '3', '9', '81'], `Factor: $x^2-9=(x-3)(x+3)=0$. The solutions are $3$ and $-3$, so the positive solution is 3.`),
  mc('Advanced Math', 'Absolute value equations', 'Medium', `What is the sum of the solutions to $|2x-5|=7$?`, 'A', ['5', '6', '7', '12'], `Solve $2x-5=7$ to get $x=6$, and $2x-5=-7$ to get $x=-1$. Their sum is $6+(-1)=5$.`),
  spr('Advanced Math', 'Exponential growth', 'Medium', `A culture initially contains 200 bacteria and grows by 5% each hour. How many bacteria does the model predict after 2 hours?`, ['220.5'], `Multiply by the growth factor 1.05 twice: $200(1.05)^2=200(1.1025)=220.5$.`),
  mc('Algebra', 'Linear inequalities', 'Medium', `Which inequality is equivalent to $3x-4>11$?`, 'D', ['$x>3$', '$x<5$', '$x<7$', '$x>5$'], `Add 4 to obtain $3x>15$, then divide by positive 3. The result is $x>5$.`),
  mc('Geometry and Trigonometry', 'Circles', 'Medium', `A circle has diameter 10. What is its area?`, 'C', ['$10pi$', '$20pi$', '$25pi$', '$100pi$'], `The radius is half the diameter, so $r=5$. Area is $pi r^2=25pi$.`),
  mc('Problem Solving and Data Analysis', 'Percentages', 'Medium', `After a 20% discount, a jacket costs 64 dollars. What was its price before the discount?`, 'A', ['80 dollars', '76.80 dollars', '72 dollars', '51.20 dollars'], `The sale price is 80% of the original price $p$: $0.80p=64$. Thus $p=64/0.80=80$.`),
  spr('Advanced Math', 'Equivalent expressions', 'Advanced', `The expression $x^2-7x+10$ can be written as $(x-a)(x-b)$, where $a$ and $b$ are positive integers and $a<b$. What is the value of $a$?`, ['2'], `Find two numbers whose product is 10 and sum is 7: 2 and 5. Thus $x^2-7x+10=(x-2)(x-5)$ and $a=2$.`),
  mc('Geometry and Trigonometry', 'Similar triangles', 'Advanced', `Triangles $ABC$ and $DEF$ are similar. Side $AB=8$ corresponds to side $DE=12$. If side $BC=10$, what is the length of corresponding side $EF$?`, 'C', ['12', '14', '15', '18'], `The scale factor from $ABC$ to $DEF$ is $12/8=3/2$. Therefore $EF=10(3/2)=15$.`),
  mc('Problem Solving and Data Analysis', 'Measures of center', 'Advanced', `A data set contains five values and has a mean of 12. When the greatest value is removed, the remaining four values have a mean of 9. What is the greatest value?`, 'D', ['12', '15', '20', '24'], `The five values have total $5(12)=60$. The remaining four have total $4(9)=36$, so the removed greatest value is $60-36=24$.`),
  mc('Advanced Math', 'Exponential equations', 'Advanced', `If $3^{x+1}=81$, what is the value of $x$?`, 'C', ['2', '2.5', '3', '4'], `Since $81=3^4$, equal bases give $x+1=4$. Therefore $x=3$.`),
  spr('Geometry and Trigonometry', 'Right triangles and trigonometry', 'Advanced', `In a right triangle, $sin(theta)=3/5$. The side opposite $theta$ has length 12. What is the length of the hypotenuse?`, ['20'], `Since $sin(theta)=opposite/hypotenuse$, $12/h=3/5$. Cross-multiplying gives $3h=60$, so $h=20$.`),
  spr('Algebra', 'Systems of linear equations', 'Advanced', `For what value of $k$ do the equations $kx+6=3x+6$ have infinitely many solutions?`, ['3'], `Infinitely many solutions occur when both sides are identical for every $x$. Their $x$-coefficients must match, so $k=3$.`),
]

const MATH2: DraftQuestion[] = [
  mc('Algebra', 'Linear equations in one variable', 'Medium', `If $5(2x-3)=4x+21$, what is the value of $x$?`, 'D', ['4', '5', '5.5', '6'], `Expand and solve: $10x-15=4x+21$, so $6x=36$ and $x=6$.`),
  mc('Problem Solving and Data Analysis', 'Percent change', 'Medium', `A population increased from 240 to 300. What was the percent increase?`, 'B', ['20%', '25%', '60%', '80%'], `The increase is $300-240=60$. Relative to the original, $60/240=0.25$, or 25%.`),
  mc('Algebra', 'Systems of linear equations', 'Medium', `For the system $2x+y=11$ and $x-y=1$, what is the value of $y$?`, 'A', ['3', '4', '5', '7'], `Add the equations to get $3x=12$, so $x=4$. Substitute into $x-y=1$: $4-y=1$, hence $y=3$.`),
  mc('Geometry and Trigonometry', 'Triangles', 'Medium', `The angles of a triangle have measures $x$, $2x$, and $3x$ degrees. What is the measure of the largest angle?`, 'C', ['30 degrees', '60 degrees', '90 degrees', '120 degrees'], `Triangle angles sum to 180: $x+2x+3x=6x=180$, so $x=30$. The largest angle is $3x=90$ degrees.`),
  mc('Algebra', 'Linear functions', 'Medium', `Line $p$ has slope $2/3$. Which equation represents a line perpendicular to $p$?`, 'B', ['$y=(2/3)x+4$', '$y=-(3/2)x+4$', '$y=-(2/3)x+4$', '$y=(3/2)x+4$'], `Perpendicular nonvertical lines have slopes that are negative reciprocals. The negative reciprocal of $2/3$ is $-3/2$.`),
  spr('Advanced Math', 'Exponential equations', 'Medium', `If $2^{x-1}=32$, what is the value of $x$?`, ['6'], `Because $32=2^5$, $x-1=5$. Therefore $x=6$.`),
  mc('Problem Solving and Data Analysis', 'Probability', 'Medium', `A bag contains 4 green, 5 yellow, and 3 purple tokens. One token is selected at random. What is the probability that it is not yellow?`, 'C', ['$5/12$', '$1/2$', '$7/12$', '$2/3$'], `There are 12 tokens total and $4+3=7$ are not yellow. The probability is $7/12$.`),
  mc('Advanced Math', 'Quadratic equations', 'Advanced', `Which equation has exactly one real solution?`, 'A', ['$x^2-6x+9=0$', '$x^2-9=0$', '$x^2+x-6=0$', '$x^2+1=2x+4$'], `Choice A is $(x-3)^2=0$, which has one repeated real solution. The other equations have two distinct real solutions.`),
  mc('Algebra', 'Linear functions', 'Advanced', `A linear function $f$ satisfies $f(4)=11$ and $f(10)=29$. What is $f(0)$?`, 'D', ['-3', '-2', '0', '-1'], `The slope is $(29-11)/(10-4)=18/6=3$. Using $11=3(4)+b$ gives $b=-1$, so $f(0)=-1$.`),
  mc('Geometry and Trigonometry', 'Circles', 'Advanced', `The equation of a circle is $(x-4)^2+(y+1)^2=49$. What is the radius of the circle?`, 'C', ['4', '6', '7', '49'], `In standard form, the right side is $r^2$. Thus $r^2=49$ and the positive radius is $r=7$.`),
  spr('Advanced Math', 'Rational equations', 'Advanced', `If $3/(x-1)=1/4$, what is the value of $x$?`, ['13'], `Cross-multiply: $3(4)=x-1$. Thus $12=x-1$ and $x=13$, which is valid because it is not 1.`),
  mc('Advanced Math', 'Exponential functions', 'Advanced', `A function is defined by $g(x)=6(1.2)^x$. Which statement is true?`, 'D', ['The initial value is 1.2 and the function decreases by 6% each unit.', 'The initial value is 6 and the function decreases by 20% each unit.', 'The initial value is 1.2 and the function increases by 6% each unit.', 'The initial value is 6 and the function increases by 20% each unit.'], `In $a(1+r)^x$, $a$ is the initial value and $r$ is the growth rate. Here $a=6$ and $1+r=1.2$, so $r=0.2=20%$.`),
  mc('Advanced Math', 'Quadratic equations', 'Advanced', `For what value of $c$ does $x^2-8x+c=0$ have exactly one real solution?`, 'B', ['8', '16', '32', '64'], `One real solution requires discriminant zero: $(-8)^2-4(1)c=0$. Thus $64-4c=0$ and $c=16$.`),
  spr('Geometry and Trigonometry', 'Right triangles and trigonometry', 'Advanced', `In a right triangle, $tan(theta)=5/12$. If the side adjacent to $theta$ has length 36, what is the length of the side opposite $theta$?`, ['15'], `Use $tan(theta)=opposite/adjacent$. Then $5/12=o/36$, so $o=36(5/12)=15$.`),
  mc('Advanced Math', 'Transformations of functions', 'Advanced', `The graph of $y=(x-5)^2+2$ is obtained from the graph of $y=x^2$ by shifting it`, 'A', ['5 units right and 2 units up.', '5 units left and 2 units up.', '2 units right and 5 units up.', '5 units right and 2 units down.'], `Replacing $x$ with $x-5$ shifts the graph 5 units right, and adding 2 shifts it 2 units up.`),
  mc('Algebra', 'Systems of linear equations in context', 'Advanced', `A theater sold 180 tickets. Adult tickets cost 12 dollars, student tickets cost 8 dollars, and total revenue was 1,840 dollars. How many adult tickets were sold?`, 'C', ['80', '90', '100', '120'], `Let $a$ be adult tickets and $s$ student tickets. From $a+s=180$ and $12a+8s=1840$, substitute $s=180-a$: $12a+1440-8a=1840$, so $4a=400$ and $a=100$.`),
  mc('Advanced Math', 'Polynomials', 'Advanced', `When $P(x)=x^3-4x^2+x+6$ is divided by $x-2$, what is the remainder?`, 'A', ['0', '2', '4', '6'], `By the Remainder Theorem, the remainder is $P(2)=8-16+2+6=0$.`),
  spr('Advanced Math', 'Systems of nonlinear equations', 'Advanced', `The graphs of $y=x^2$ and $y=2x+3$ intersect at two points. What is the sum of the $x$-coordinates of those points?`, ['2'], `Set the equations equal: $x^2=2x+3$, so $x^2-2x-3=0$. The roots are 3 and -1, whose sum is 2.`),
  mc('Algebra', 'Linear equations in context', 'Advanced', `Tank A contains 120 liters of water and drains at 4 liters per minute. Tank B contains 30 liters and fills at 2 liters per minute. After how many minutes will the tanks contain equal amounts?`, 'C', ['10', '12', '15', '18'], `Set the amounts equal: $120-4t=30+2t$. Then $90=6t$, so $t=15$ minutes.`),
  mc('Algebra', 'Rates and proportional relationships', 'Advanced', `Machine X completes a job in 6 hours, and machine Y completes the same job in 4 hours. Working together at constant rates, how long do they take?`, 'B', ['2 hours', '2.4 hours', '3 hours', '5 hours'], `Their combined rate is $1/6+1/4=2/12+3/12=5/12$ job per hour. Time is the reciprocal, $12/5=2.4$ hours.`),
  spr('Algebra', 'Systems with a parameter', 'Advanced', `The system $y=2x+5$ and $y=kx-1$ intersects at a point whose $x$-coordinate is 3. What is the value of $k$?`, ['4'], `At $x=3$, the first equation gives $y=2(3)+5=11$. Then $11=3k-1$, so $3k=12$ and $k=4$.`),
  spr('Advanced Math', 'Quadratic functions', 'Advanced', `For the quadratic function $f(x)=-2x^2+16x-11$, what is the maximum value of $f(x)$?`, ['21'], `The vertex occurs at $x=-b/(2a)=-16/(2(-2))=4$. Evaluate: $f(4)=-2(16)+64-11=21$. Since the leading coefficient is negative, this vertex value is the maximum.`),
]

const MODULE_META: Array<{
  id: SATModuleId
  title: string
  shortTitle: string
  section: SATSection
  durationSeconds: number
  drafts: DraftQuestion[]
}> = [
  { id: 'rw1', title: 'Reading and Writing - Module 1', shortTitle: 'R&W Module 1', section: 'reading-writing', durationSeconds: 32 * 60, drafts: RW1 },
  { id: 'rw2', title: 'Reading and Writing - Module 2 (Upper Route)', shortTitle: 'R&W Module 2', section: 'reading-writing', durationSeconds: 32 * 60, drafts: RW2 },
  { id: 'math1', title: 'Math - Module 1', shortTitle: 'Math Module 1', section: 'math', durationSeconds: 35 * 60, drafts: MATH1 },
  { id: 'math2', title: 'Math - Module 2 (Upper Route)', shortTitle: 'Math Module 2', section: 'math', durationSeconds: 35 * 60, drafts: MATH2 },
]

function buildModule(meta: (typeof MODULE_META)[number]): SATModule {
  return {
    id: meta.id,
    title: meta.title,
    shortTitle: meta.shortTitle,
    section: meta.section,
    durationSeconds: meta.durationSeconds,
    questions: meta.drafts.map((draft, index) => ({
      ...draft,
      id: `smarttest-mock-1-${meta.id}-${index + 1}`,
      moduleId: meta.id,
      number: index + 1,
      section: meta.section,
      asset: '',
      assetWidth: 0,
      assetHeight: 0,
    })),
  }
}

export const SAT_SMARTTEST_MOCK_1_MODULES: SATModule[] = MODULE_META.map(buildModule)

export const SAT_SMARTTEST_MOCK_1 = {
  id: 'smarttest-sat-mock-1' as const,
  title: 'SmartTest Digital SAT Mock 1',
  subtitle: 'Original full-length upper-route simulation',
  questionCount: 98,
  totalDurationSeconds: SAT_SMARTTEST_MOCK_1_MODULES.reduce(
    (sum, module) => sum + module.durationSeconds,
    0,
  ),
  modules: SAT_SMARTTEST_MOCK_1_MODULES,
}

function countByDomain(questions: SATQuestion[]) {
  return questions.reduce<Record<string, number>>((counts, question) => {
    counts[question.domain] = (counts[question.domain] ?? 0) + 1
    return counts
  }, {})
}

export function validateSmartTestMock1(): string[] {
  const errors: string[] = []
  const expectedLengths: Record<SATModuleId, number> = { rw1: 27, rw2: 27, math1: 22, math2: 22 }
  const allQuestions = SAT_SMARTTEST_MOCK_1_MODULES.flatMap((module) => module.questions)

  SAT_SMARTTEST_MOCK_1_MODULES.forEach((module) => {
    if (module.questions.length !== expectedLengths[module.id]) {
      errors.push(`${module.id}: expected ${expectedLengths[module.id]} questions, received ${module.questions.length}`)
    }
    module.questions.forEach((question, index) => {
      if (question.number !== index + 1) errors.push(`${question.id}: nonsequential question number`)
      if (!question.prompt.trim()) errors.push(`${question.id}: missing prompt`)
      if (!question.explanation.trim()) errors.push(`${question.id}: missing explanation`)
      if (question.kind === 'multiple-choice') {
        if (question.choices.length !== 4) errors.push(`${question.id}: expected four choices`)
        if (!question.choices.some((choice) => choice.key === question.correctAnswer)) {
          errors.push(`${question.id}: answer key does not match a choice`)
        }
      } else if (!question.acceptedAnswers?.length) {
        errors.push(`${question.id}: student response has no accepted answer`)
      }
    })

    const difficultyRank: Record<Difficulty, number> = { Foundation: 0, Medium: 1, Advanced: 2 }
    if (module.section === 'math') {
      module.questions.slice(1).forEach((question, index) => {
        const previous = module.questions[index]
        if (difficultyRank[question.difficulty] < difficultyRank[previous.difficulty]) {
          errors.push(`${question.id}: math difficulty decreases after ${previous.id}`)
        }
      })
    } else {
      const domainOrder = [
        'Craft and Structure',
        'Information and Ideas',
        'Standard English Conventions',
        'Expression of Ideas',
      ]
      module.questions.slice(1).forEach((question, index) => {
        const previous = module.questions[index]
        if (domainOrder.indexOf(question.domain) < domainOrder.indexOf(previous.domain)) {
          errors.push(`${question.id}: reading-writing domain sequence is invalid`)
        }
        if (question.skill === previous.skill && difficultyRank[question.difficulty] < difficultyRank[previous.difficulty]) {
          errors.push(`${question.id}: difficulty decreases within ${question.skill}`)
        }
      })
      module.questions.forEach((question) => {
        const stimulusWords = question.prompt.replace(/[\n*_]+/g, ' ').trim().split(/\s+/).length
        if (stimulusWords < 25 || stimulusWords > 150) {
          errors.push(`${question.id}: reading-writing stimulus has ${stimulusWords} words`)
        }
      })
    }
  })

  if (allQuestions.length !== 98) errors.push(`expected 98 total questions, received ${allQuestions.length}`)
  if (new Set(allQuestions.map((question) => question.id)).size !== allQuestions.length) {
    errors.push('question IDs are not unique')
  }

  const rwDomains = countByDomain(allQuestions.filter((question) => question.section === 'reading-writing'))
  const expectedRwDomains: Record<string, number> = {
    'Craft and Structure': 16,
    'Information and Ideas': 14,
    'Standard English Conventions': 14,
    'Expression of Ideas': 10,
  }
  Object.entries(expectedRwDomains).forEach(([domain, expected]) => {
    if (rwDomains[domain] !== expected) errors.push(`${domain}: expected ${expected}, received ${rwDomains[domain] ?? 0}`)
  })

  const mathDomains = countByDomain(allQuestions.filter((question) => question.section === 'math'))
  const expectedMathDomains: Record<string, number> = {
    Algebra: 15,
    'Advanced Math': 15,
    'Problem Solving and Data Analysis': 7,
    'Geometry and Trigonometry': 7,
  }
  Object.entries(expectedMathDomains).forEach(([domain, expected]) => {
    if (mathDomains[domain] !== expected) errors.push(`${domain}: expected ${expected}, received ${mathDomains[domain] ?? 0}`)
  })

  const studentResponses = allQuestions.filter((question) => question.kind === 'student-response').length
  if (studentResponses !== 12) errors.push(`expected 12 student responses, received ${studentResponses}`)

  return errors
}

const validationErrors = validateSmartTestMock1()
if (validationErrors.length) {
  throw new Error(`Invalid SmartTest SAT Mock 1:\n${validationErrors.join('\n')}`)
}
