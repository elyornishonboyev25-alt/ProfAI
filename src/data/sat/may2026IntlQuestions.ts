type ModuleId = 'rw1' | 'rw2' | 'math1' | 'math2'

type Visual = { asset: string; alt: string }

type MayQuestion = {
  id: string
  moduleId: ModuleId
  number: number
  prompt: string
  kind: 'multiple-choice' | 'student-response'
  correctAnswer: string
  acceptedAnswers?: string[]
  tolerance?: number
  choices: Array<{ key: string; text: string }>
  visual?: Visual
  rationale: string
}

const keys = ['A', 'B', 'C', 'D']

function mc(
  moduleId: ModuleId,
  number: number,
  prompt: string,
  correctAnswer: string,
  choices: string[],
  rationale: string,
  visual?: Visual,
): MayQuestion {
  return {
    id: `${moduleId}-${number}`,
    moduleId,
    number,
    prompt,
    kind: 'multiple-choice',
    correctAnswer,
    choices: choices.map((text, index) => ({ key: keys[index], text })),
    rationale,
    visual,
  }
}

function sr(
  moduleId: ModuleId,
  number: number,
  prompt: string,
  acceptedAnswers: string[],
  rationale: string,
  tolerance?: number,
): MayQuestion {
  return {
    id: `${moduleId}-${number}`,
    moduleId,
    number,
    prompt,
    kind: 'student-response',
    correctAnswer: acceptedAnswers[0],
    acceptedAnswers,
    tolerance,
    choices: [],
    rationale,
  }
}

export const may2026IntlQuestions: MayQuestion[] = [
  mc('rw1', 1, `*Dragon against Tiger* is an important work of Nihonga, or classical Japanese painting. Unlike Wada Eisaku, who adopted traditional European methods such as painting with oil on canvas, Hashimoto Gahō _______ traditional Japanese approaches. For instance, Hashimoto produced *Dragon against Tiger* by applying color pigments to a silk surface.

Which choice completes the text with the most logical and precise word or phrase?`, 'C', ['overlooked', 'distrusted', 'embraced', 'released'], 'The contrast with Wada and the example of pigments on silk show that Hashimoto **embraced** traditional Japanese methods.'),
  mc('rw1', 2, `The following text is from Kenneth Grahame's 1908 novel *The Wind in the Willows*. The Mole is returning home after a visit to Mr. Badger's house.

As he hurried along, eagerly anticipating the moment when he would be at home again among the things he knew and liked, the Mole saw clearly that he was an animal of tilled field and hedge-row, linked to the ploughed furrow, the frequented pasture, the lane of evening lingerings, the cultivated garden-plot.

As used in the text, what does the word “anticipating” most nearly mean?`, 'C', ['Describing', 'Getting ahead of', 'Looking forward to', 'Instructing'], 'The Mole eagerly thinks about a desired future moment, so “anticipating” means **looking forward to**.'),
  mc('rw1', 3, `The human body has three types of muscle—_______ cardiac, and skeletal. The levator labii superioris is a skeletal muscle—of which the body contains more than six hundred—and it helps with raising the corners of the mouth.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ['tissue and smooth,', 'tissue: smooth,', 'tissue smooth,', 'tissue. Smooth'], 'A colon correctly introduces the list of the three tissue types, and commas separate the listed items.'),
  mc('rw1', 4, `The Fly River delta is a remarkably _______ landscape: it is a constantly evolving network of channels and strips of land that change in size and shape as the river deposits new sediment particles where the river meets the waters of the Gulf of Papua.

Which choice completes the text with the most logical and precise word or phrase?`, 'A', ['mutable', 'habitable', 'secluded', 'homogeneous'], 'The landscape constantly changes in size and shape, so **mutable**, meaning changeable, is the precise word.'),
  mc('rw1', 5, `Ben Prud'homme and colleagues have explained how <u>convergent evolution—a phenomenon that occurs when the same trait evolves independently in two reproductively separate lineages—</u>can result from a genetic mechanism shared by both lineages. Meanwhile, Patricia J. Wittkopp and colleagues have investigated how convergence occurs through different genetic mechanisms, but the relative prevalence of convergence through shared and different genetic processes is still poorly understood. This motivated biologists Delbert A. Green II and Cassandra G. Extavour to evaluate both types of convergence in a single study for their 2012 paper.

Which choice best states the function of the underlined portion in the text as a whole?`, 'B', ['It provides examples of how a phenomenon was studied by scientists in the field before Green and Extavour’s study.', 'It gives a basic description of a phenomenon that is central to the discussion that follows.', 'It clarifies a concept that the author implies was unstated in the studies mentioned in the text.', 'It introduces a method of scientific analysis that is discussed in greater detail later in the text.'], 'The underlined parenthetical defines convergent evolution, the central phenomenon discussed in the rest of the passage.'),
  mc('rw1', 6, `In what is now Washington state, the Tulalip Tribes operate the Hibulb Cultural Center. Relying on traditional knowledge to guide the design of exhibits, this institution presents Tulalip history and culture to the tribes’ citizens. The Turtle Mountain Band of Chippewa, a tribe in North Dakota, employs a similar strategy in its own cultural center. Both centers contrast with museums that aren’t Indigenous-led; when displaying Indigenous artifacts, such museums tend to anticipate mainly non-Indigenous audiences and rely on Euro-centric strategies for designing exhibits.

Which choice best describes the overall structure of the text?`, 'C', ['It describes how tribal cultural centers designed exhibits of a particular set of artifacts, then analyzes how non-Indigenous institutions designed exhibits of the same artifacts.', 'It examines how tribal citizens respond to exhibits at tribal cultural centers, then speculates how non-Indigenous audiences would respond to the same exhibits.', 'It discusses two cultural centers operated by tribes, then compares them with non-Indigenous institutions that present Indigenous exhibits.', 'It outlines an early strategy for exhibit design used by one tribal cultural center, then explains a newer strategy used by a different tribal cultural center.'], 'The text first presents two tribe-operated centers and then contrasts their practices with those of non-Indigenous-led museums.'),
  mc('rw1', 7, `**Text 1**

Uisdean Nicholson and his team have discovered evidence in seismic data of a 40-kilometer-wide subsurface crater beneath nearly a kilometer of water off the coast of West Africa that is consistent with a 400-meter-wide asteroid striking the seafloor. This structure, which the team named Nadir, exhibits all the telltale signs of a high-velocity impact crater: an elevated rim, a circular shape, a terraced floor, and a pronounced area of uplift at its center.

**Text 2**

Both carbonate dissolution and subsurface salt withdrawal can cause craterlike depressions without the need for a high-velocity impact. However, carbonate dissolution is very unlikely to have occurred in the vicinity of Nadir, and although subsurface salt withdrawal could plausibly occur in this area and would result in a depression with a terraced floor or a circular shape, it would not exhibit the area of central uplift seen at Nadir.

Which choice best describes a difference between the approach of Text 1 and the approach of Text 2?`, 'C', ['Text 1 dispassionately describes Nicholson and colleagues’ findings and conclusions, whereas Text 2 attempts to convey the researchers’ excitement on discovering Nadir.', 'Text 1 focuses on features Nadir lacks, whereas Text 2 indicates features it shares with other geological depressions.', 'Text 1 discusses a single plausible cause of Nadir, whereas Text 2 evaluates two possible causes.', 'Text 1 emphasizes the evidence supporting an asteroid impact as the cause of Nadir, whereas Text 2 argues against that explanation.'], 'Text 1 presents asteroid impact as the cause, while Text 2 separately evaluates carbonate dissolution and salt withdrawal.'),
  mc('rw1', 8, `“Cocoa” is an example of a loanword—that is, a word that originated in one language and was later adopted by another. The word came to English indirectly from *cacao*, the Spanish word for the plant that chocolate is made from. Spanish had borrowed it from Nahuatl, an Indigenous language of Central Mexico, in which the word’s original form is *cacahuatl*. “Puma” is also Indigenous in origin and entered English through Spanish. But in this case, the original source was Quechua, a language of South America, in which the word for the mountain lion is also *puma*.

The author makes which point about the Spanish language?`, 'A', ['It has served as a medium through which Indigenous languages have influenced English.', 'Its contribution to English vocabulary roughly equals the collective contribution by Indigenous languages.', 'It adopted Nahuatl and Quechua words in approximately equal numbers.', 'It has borrowed words from Indigenous languages and contributed words to them.'], 'Both examples traveled from Indigenous languages through Spanish into English, making Spanish the medium of influence.'),
  mc('rw1', 9, `Motivated to sell as many paintings as possible, Alfred Hair, an influential figure among the landscape artists known as the Florida Highwaymen, pioneered “fast painting,” which in part involved working across multiple canvases at once. That many of Hair’s acolytes, including Isaac Knight, imitated the technique accounts in part for the impressionistic qualities that are now synonymous with the group’s shared aesthetic. But not all Highwaymen fully embraced this approach; for instance, though Willie Reagan was also prolific, his paintings were executed with greater attention to detail.

What does the text most strongly suggest about paintings by Knight?`, 'A', ['Because of the manner in which they were created, they likely have visual qualities that are regarded as more typical of Florida Highwaymen paintings than the qualities in works by Reagan are.', 'Although it is evident that Knight adopted some of Hair’s preferred techniques, Knight’s works are less derivative of works by Hair than is typically acknowledged.', 'Knight’s reliance on the technique of fast painting likely accounts for his works being more aesthetically interesting than works by Reagan are.', 'The lack of precision with which they were executed suggests that they are inferior to works by either Hair or Reagan.'], 'Knight used the fast-painting method linked to the group’s typical impressionistic style, while Reagan’s detailed method was less typical.'),
  mc('rw1', 10, `The following text is adapted from Daniel Defoe’s 1704 nonfiction book *The Storm*.

The sermon is a sound of words spoken to the ear, and prepared only for present meditation, and extends no farther than the strength of memory can convey it; a book printed is a record; remaining in every man’s possession, always ready to renew its acquaintance with his memory, and always ready to be produced as an authority or voucher to any reports he makes out of it, and conveys its contents for ages to come, to the eternity of mortal time, when the author is forgotten in his grave.

Which choice best states the main idea of the text?`, 'A', ['Words committed to print have a greater permanence than messages that are merely spoken aloud.', 'People are less likely to forget a message when they hear it spoken aloud than they are when they read it in print.', 'Unless a spoken message is delivered by an expert, it can be safely ignored.', 'Most authors have little hope of being remembered well past their lifetimes.'], 'Defoe contrasts a sermon limited by memory with a printed book that remains available for ages.'),
  mc('rw1', 11, `A student is researching trends in the topics submitted to a national science fair for high school students. The graph shows the number of submissions by topic that were made each year. Based on the data in the graph, the student claims that there were more medicine and health research topics submitted in 2019 than in any other year.

Which choice most effectively uses data from the graph to support the claim?`, 'D', ['In 2016, the number of cellular and molecular biology topic submissions was the same as the number of animal science topic submissions.', 'In 2019, there were more physics and space science topic submissions than there were medicine and health topic submissions.', 'The lowest number of animal science topic submissions in a year was approximately 95 in 2016.', 'The highest number of medicine and health topic submissions during the period shown is approximately 285 in 2019.'], 'The medicine-and-health series reaches its period high, about 285 submissions, in 2019.', { asset: '/sat/may-2026-intl/visuals/rw1-11-research-submissions.png', alt: 'Line graph of science research submissions by topic from 2016 through 2019' }),
  mc('rw1', 12, `*Poems* is an 1895 collection of poetry by Frances E.W. Harper. In one of Harper’s poems, the speaker criticizes activists who champion humanitarian causes in other countries while overlooking local concerns, saying, _______.

Which quotation from *Poems* most effectively illustrates the claim?`, 'B', ['“Men may tread down the poor and lowly. / May crush them in anger and hate, / But surely the mills of God’s justice / Will grind out the grist of their fate.” (from “An Appeal to My Countrywomen”)', '“When ye plead for the wrecked and fallen. / The exile from far distant shores, / Remember that men are still wasting / Life’s crimson around your own doors.” (from “An Appeal to My Countrywomen”)', '“God bless our native land, / Land of newly free. / Oh may she ever stand / For truth and liberty.” (from “God Bless Our Native Land”)', '“Let me make the songs for the people, / Songs for the old and young; / Songs to stir like a battle-cry / Wherever they are sung.” (from “Songs for the People”)'], 'The quotation explicitly contrasts pleading for people on distant shores with ignoring suffering “around your own doors.”'),
  mc('rw1', 13, `Students in a biology class investigated why individual house mice (*Mus musculus*) can differ from one another in their circulating sodium level. The students compared wild-type mice and knockout mice, which are mice with specific genes deactivated, when mice of each type were placed in similar naturalistic environments and taken for periodic blood sampling. Finding that knockout mice with the gene *Asb5* deactivated tended to have lower concentrations of sodium in their blood than did wild-type mice, the students concluded that differences in circulating sodium level among house mice in nature are solely attributable to variations in the level of expression of *Asb5*.

Which finding, if true, would most directly weaken the students’ conclusion?`, 'A', ['Some wild-type mice were very similar to the knockout mice with regard to circulating sodium level but showed a wide variety of levels of expression of *Asb5*.', 'A sampling of house mice captured in natural settings shows that individual mice can differ from one another in the level of expression of *Asb5*.', 'The mice with *Asb5* deactivated were identical to the wild-type mice except with regard to circulating sodium level.', 'The level of expression of *Asb5* does not appear to affect the functioning of any other genes in house mice.'], 'Similar sodium levels paired with widely varying *Asb5* expression directly contradict the claim that *Asb5* alone determines sodium differences.'),
  mc('rw1', 14, `Veronica L. Bura, Akito Y. Kawahara, and Jayne E. Yack investigated the evolution and function of sound production in silk moth and hawk moth caterpillars. They found that during harmless simulated attacks on isolated caterpillars, 33% of the tested species produced sound, which ranged from clicks in *Actias luna* to whistles in *Rhodinia fugax*. Although some insects use sound to communicate with members of the same species, the researchers claim that the caterpillar sounds recorded in their study are directed primarily at predators.

Which finding, if true, would most directly support Bura and colleagues’ claim?`, 'B', ['In most cases, the sound that a caterpillar species produced during simulated attacks was not produced by other caterpillar species during simulated attacks.', 'Chickens and yellow warblers, two predators of caterpillars, have been observed to stop their attacks in response to caterpillar sounds.', 'Each caterpillar species tended to produce one sound during simulated attacks, although individuals occasionally made a variety of other sounds during simulated attacks as well.', 'Caterpillar clicks were emitted in a frequency detectable by birds that prey on caterpillars, but caterpillar whistles were not.'], 'Predators stopping their attacks in response to the sounds directly supports the proposed antipredator function.'),
  mc('rw1', 15, `In dialects of English spoken in Scotland, the “r” sound is strongly emphasized when it appears at the end of syllables (as in “car”) or before other consonant sounds (as in “bird”). English dialects of the Upland South, a region stretching from Oklahoma to western Virginia, place similar emphasis on “r” at the ends of syllables and before other consonant sounds. Historical records show that the Upland South was colonized largely by people whose ancestors came from Scotland. Thus, linguists have concluded that _______.

Which choice most logically completes the text?`, 'A', ['the English dialects spoken in the Upland South acquired their emphasis on the “r” sound from dialects spoken in Scotland.', 'emphasis on the “r” sound will eventually spread from English dialects spoken in the Upland South to dialects spoken elsewhere.', 'the English dialects spoken in Scotland were influenced by dialects spoken in the Upland South.', 'people from Scotland abandoned their emphasis on the “r” sound after relocating to the Upland South.'], 'The shared pronunciation and migration history support influence from Scottish dialects on Upland South dialects.'),
  mc('rw1', 16, `What makes the theremin a unique musical instrument? You play it without touching it. When you place your _______ the pitch will shift as your hands move through the air.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ["hand's between the two antenna's,", 'hands between the two antennas,', "hands' between the two antennas,", "hands' between the two antennas,"], 'The sentence needs ordinary plural nouns: **hands** and **antennas**, with no possessive apostrophes.'),
  mc('rw1', 17, `Round Rock Chapter is one of the 110 chapters of the Navajo Nation (Naabeehó Bináhásdzoh). The chapter, known as Tsé Nikání in the Navajo language (Diné bizaad), was the subject of a profile _______ in the *Navajo Times* on February 13, 2014.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ['appeared', 'appearing', 'appears', 'has appeared'], 'The participle **appearing** correctly modifies “profile” without creating a second finite verb.'),
  mc('rw1', 18, `San Juan High School and Grand County High School are two of several Utah _______ enormous geoglyph of the letters SJ overlooks San Juan High, while a geoglyph of the letter G overlooks Grand County High.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'A', ['schools that have their own hillside geoglyphs. An', 'schools that have their own hillside geoglyphs and an', 'schools that have their own hillside geoglyphs, an', 'schools, that have their own hillside geoglyphs, and an'], 'A period correctly separates two independent sentences; “An” then begins the second sentence.'),
  mc('rw1', 19, `Deposits of crushed orange limestone and other organic matter lend the sand at Porto Ferro Beach in Italy an unusual orange tint that dazzles _______ they take a bit of sand home, though, it disturbs the beach’s ecosystem by contributing to erosion.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'D', ['visitors, when', 'visitors and when', 'visitors when', 'visitors. When'], 'A period is required between the complete idea ending in “visitors” and the new sentence beginning with “When.”'),
  mc('rw1', 20, `Consider the mechanics of the pinhole camera: light passes through a small hole, resulting in a focused projected image. A ray diagram reveals how this _______ the hole’s small size restricts light to a single ray, all light passing through the hole can only arrive at a single destination, eliminating diffraction and ensuring a clear image.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ['works because', 'works. Because', "works, it's because", "works: it's because"], '“A ray diagram reveals how this works” is complete; the following dependent clause beginning “Because” introduces the explanation.'),
  mc('rw1', 21, `While the greater adjutant can be found in places like the Central Tanintharyi Coast in Myanmar and the Prek Toal Bird Sanctuary in Cambodia, more than 80 percent of this endangered stork species is found in Assam, India. There, wildlife biologist Dr. Purnima Devi Barman is on the front lines of conservation efforts that, through community involvement and scientific _______ aim to bring adjutants back from near extinction.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ['study', 'study,', 'study:', 'study—'], 'The comma closes the interrupting prepositional phrase “through community involvement and scientific study.”'),
  mc('rw1', 22, `In 1949, Frank Zamboni developed an ice rink resurfacing machine. As Zamboni’s machine moved along the rink’s surface, it first scraped off the top layer of ice. _______ It sprayed water into the deep grooves left behind by customers’ skates. Lastly, it smoothed over the newly formed ice.

Which choice completes the text with the most logical transition?`, 'B', ['For example,', 'Next,', 'Similarly,', 'In contrast,'], 'The passage lists steps in order: first scraping, **next** spraying, and lastly smoothing.'),
  mc('rw1', 23, `While researching a topic, a student has taken the following notes:

- A lever is a simple machine consisting of a rigid beam and a fulcrum.
- The fulcrum is the point about which the beam pivots.
- The input force (effort) is the force applied to the lever.
- The output force (load) is the force that the lever exerts on another object.
- In first-class levers, the fulcrum is located between the effort and the load.
- In second-class levers, the load is located between the effort and the fulcrum.

The student wants to contrast first-class levers and second-class levers. Which choice most effectively uses relevant information from the notes to accomplish this goal?`, 'D', ['In levers, the effort is the force applied to the lever; the load, in contrast, is the force that the lever exerts on another object.', 'In first-class and second-class levers, the fulcrum and the load are in different locations.', 'First-class levers are simple machines consisting of a rigid beam and a fulcrum, but then again, the same is true of second-class levers.', 'In first-class levers, the fulcrum is located between the effort and the load, but in second-class levers, the load is located between the effort and the fulcrum.'], 'Choice D states the precise positional difference between the two lever classes.'),
  mc('rw1', 24, `While researching a topic, a student has taken the following notes:

- Richard Serra is an American artist.
- He is known for his large metal sculptures.
- His large sculpture *Open Ended* is made of weathering steel.
- His large sculpture *Strike: To Roberta and Rudy* is made of hot-rolled steel.

Which choice most effectively uses information from the notes to emphasize a difference between the two sculptures?`, 'D', ['*Open Ended* and *Strike: To Roberta and Rudy* are both large metal sculptures by artist Richard Serra.', '*Strike: To Roberta and Rudy* is one of artist Richard Serra’s large metal sculptures.', 'Artist Richard Serra is the creator of the weathering steel sculpture *Open Ended*.', '*Open Ended* is made from a different kind of steel than *Strike: To Roberta and Rudy*.'], 'The requested contrast is directly expressed by identifying that the sculptures use different kinds of steel.'),
  mc('rw1', 25, `While researching a topic, a student has taken the following notes:

- Maya Lin is an American artist known for her memorials and large-scale installation artworks.
- She became famous in 1982 when she completed the Vietnam Veterans Memorial, which consists of two 246-foot granite walls.
- She completed *Water Line* in 2006. It is an installation composed of aluminum tubing that fills an entire gallery room.
- She completed *Seven Earth Mountain* in 2015. It is an installation composed of soil that fills an entire gallery room.

Which choice most effectively uses information from the notes to emphasize a difference between *Water Line* and *Seven Earth Mountain*?`, 'C', ['After completing the Vietnam Veterans Memorial, Maya Lin completed *Water Line*, another large-scale work.', 'The sprawling size of Maya Lin’s Vietnam Veterans Memorial is echoed in *Water Line*, a work made of aluminum tubing that fills an entire gallery room.', 'Maya Lin’s *Water Line* is composed of aluminum tubing; *Seven Earth Mountain*, by contrast, is composed of soil.', 'Maya Lin is known for her memorials and installation art, such as *Water Line* and *Seven Earth Mountain*.'], 'Choice C directly contrasts the works’ materials: aluminum tubing versus soil.'),
  mc('rw1', 26, `While researching a topic, a student has taken the following notes:

- A supercontinent is a single landmass made up of most or all of Earth’s continents.
- Over time, continents merge together to form supercontinents, which then break apart.
- This process is believed to take hundreds of millions of years and is known as the supercontinent cycle.
- Euramerica and Kenorland were supercontinents.
- Euramerica formed about 300 million years ago.
- Kenorland formed about 2.6 billion years ago.

The student wants to specify when Euramerica formed. Which choice most effectively uses relevant information from the notes to accomplish this goal?`, 'A', ['The supercontinent Euramerica formed about 300 million years ago.', 'Over hundreds of millions of years, the supercontinent cycle results in supercontinents forming and breaking apart.', 'Euramerica was a supercontinent, a single landmass made up of most or all of Earth’s continents.', 'Long ago, Earth was home to supercontinents like Euramerica and Kenorland.'], 'Choice A supplies the exact requested formation time.'),
  mc('rw1', 27, `While researching a topic, a student has taken the following notes:

- The Haystack Mountain School of Crafts (1961) is a building complex designed by American architect Edward Larrabee Barnes.
- It is located in Deer Isle, Maine.
- It features a cluster of cedar-shingled buildings.
- It is considered an impressive example of critical regionalist architecture.

Which choice most effectively uses information from the notes to emphasize the location of the Haystack Mountain School of Crafts?`, 'A', ['Those wishing to see the Haystack Mountain School of Crafts in person will have to travel to Deer Isle, Maine.', 'A stunning example of critical regionalist architecture, Edward Larrabee Barnes’s Haystack Mountain School of Crafts features a cluster of cedar-shingled buildings.', 'The architect responsible for designing the Haystack Mountain School of Crafts in Deer Isle, Maine, was Edward Larrabee Barnes.', 'Edward Larrabee Barnes is known for designing a building complex that features a cluster of cedar-shingled buildings.'], 'Choice A makes the Deer Isle, Maine, location the main point of the sentence.'),
  mc('rw2', 1, `Whether the reign of a French monarch such as Francis II or Louis XI was considered historically significant or, conversely, relatively _______, its trajectory was shaped by questions of legitimacy and therefore cannot be understood without a corollary understanding of the factors that allowed the monarch to assert a claim to the throne successfully.

Which choice completes the text with the most logical and precise word or phrase?`, 'B', ['momentous', 'inconsequential', 'benevolent', 'genuine'], '“Conversely” signals the opposite of historically significant, so **inconsequential** is precise.'),
  mc('rw2', 2, `In the 2010s, the price of vintage Teenage Mutant Ninja Turtles action figures rose dramatically, which had the counterintuitive effect of _______ demand: buyers who hadn’t previously wanted to purchase old action figures thronged the market, believing prices would continue to rise and the toys could be resold later at a profit.

Which choice completes the text with the most logical and precise word or phrase?`, 'C', ['monetizing', 'appraising', 'engendering', 'exploiting'], 'The rising prices caused or **engendered** new demand among speculative buyers.'),
  mc('rw2', 3, `Studying wrappers from discontinued candies, menus from nineteenth-century restaurants, and flyers promoting long-forgotten sporting events may seem like a frivolous pursuit, but ephemeral objects like these are useful as markers of cultural change: they can _______ shifts in norms, values, and concerns that traditional objects of historical inquiry may not.

Which choice completes the text with the most logical and precise word or phrase?`, 'A', ['register', 'vindicate', 'preclude', 'induce'], 'As cultural markers, the objects can **register**, or record and reveal, shifts.'),
  mc('rw2', 4, `_______ though it seemed to many mathematicians, the Marden tameness conjecture, posed in 1974, eventually yielded to the efforts of Ian Agol, who presented a proof of it in 2004.

Which choice completes the text with the most logical and precise word or phrase?`, 'A', ['Insuperable', 'Unequivocal', 'Irreproachable', 'Ineluctable'], 'The conjecture seemed impossible to overcome but was eventually proved, so **Insuperable** fits.'),
  mc('rw2', 5, `Why do rusty-spotted cats purr but jaguars roar? Researchers hypothesize that this difference between the two feline species may be partly due to a U-shaped bone in their throats called the hyoid. Rusty-spotted cats, which are much smaller than jaguars, have a rigid hyoid that rumbles when the cat’s larynx vibrates, resulting in a purr. By contrast, jaguars have a somewhat flexible hyoid, and the bone is attached to the skull with a stretchy ligament that rusty-spotted cats lack. These traits allow jaguars and most other species of big cats to produce powerful roars. The same traits may also prevent most big cats from purring.

Which choice best describes the overall structure of the text?`, 'C', ['The text compares the habitats of two species, then explains how those habitats are changing.', 'The text presents a theory about two species, then discusses facts that weaken it.', 'The text poses a question about two species, then presents a possible answer.', 'The text describes a behavior shared by two species, then discusses other behaviors shared by them.'], 'The opening asks why the cats vocalize differently, and the rest proposes an anatomical explanation.'),
  mc('rw2', 6, `Scholarly interest in literary juvenilia—writings by children and teenagers—tends to focus on unpublished works by authors who became famous as adults, such as Charles Dickens’s poem “The Bill of Fare,” which he wrote around the ages of 18–20, because they offer insights into their authors’ artistic development. But some scholars also argue that recovering juvenilia by lesser-known writers is essential to understanding literary history: Daisy Ashford’s novels, which she published as a child, were widely read by contemporaries and are therefore deserving of closer attention.

Which choice best states the main purpose of the text?`, 'B', ['To describe the challenges famous writers encountered when seeking to publish works written in their childhood', 'To present reasons why literary scholars consider juvenilia to be valuable resources', 'To compare the accomplishments of young writers with those of their adult contemporaries', 'To argue that Ashford’s novels have more literary merit than Dickens’s juvenilia'], 'The passage gives one reason to study famous authors’ juvenilia and another reason to recover lesser-known writers’ juvenilia.'),
  mc('rw2', 7, `To understand how temperature change affects microorganism-mediated cycling of soil nutrients in alpine ecosystems, Eva Kaštovská et al. collected plant-soil cores in the Tatra Mountains at elevations around 2,100 meters and transplanted them to elevations of 1,700–1,800 meters, where the mean air temperature was warmer by 2°C. Microorganism-mediated nutrient cycling was accelerated in the transplanted cores; crucially, microorganism community composition was unchanged, allowing Kaštovská et al. to attribute the acceleration to temperature-induced increases in microorganism activity.

It can most reasonably be inferred from the text that the finding about the microorganism community composition was important for which reason?`, 'C', ['It provided preliminary evidence that microorganism-mediated nutrient cycling was accelerated in the transplanted cores.', 'It suggested that temperature-induced changes in microorganism activity may be occurring at increasingly high elevations.', 'It ruled out a potential alternative explanation for the acceleration in microorganism-mediated nutrient cycling.', 'It clarified that microorganism activity levels in the plant-soil cores varied depending on which microorganisms comprised the community.'], 'Because the community did not change, a change in community composition could be ruled out as the cause of accelerated cycling.'),
  mc('rw2', 8, `Michael G. Campana and colleagues relied on historical DNA (hDNA)—genomic data incidentally preserved in specimens housed in natural history collections—to investigate the evolutionary origins of a fungal pathogen affecting bats. Although this approach offers unique benefits, such as access to genomic data from extirpated populations, it remains a relatively underutilized resource because DNA is often to some extent degraded, a situation not easily remediable under current methodological paradigms and with extant DNA extraction and analysis technologies.

Information in the text best supports which statement about hDNA?`, 'A', ['It may yield insights that other types of genomic data cannot.', 'It has thus far proved valuable mainly to researchers studying pathogens.', 'It may be underused because of its controversial status among scientists.', 'It tends to be much more degraded than other types of DNA of comparable age.'], 'hDNA can provide genomic information from extinct local populations, a unique source unavailable from living samples.'),
  mc('rw2', 9, `In a paper for an art history class, a student claims that Rosa Bonheur’s 1855 painting *The Horse Fair* marks a significant change in Bonheur’s artistic development.

Which quotation from an art history textbook would most effectively support the student’s claim?`, 'A', ['“The paintings that Bonheur produced before *The Horse Fair* can be thought of as belonging to her earlier style, to which she never returned.”', '“Of all Bonheur’s paintings, none so clearly represents her abilities and ideas as *The Horse Fair*.”', '“Although Bonheur was clearly influenced by other artists of her time, she was also an artist ahead of her time, as *The Horse Fair* demonstrates.”', '“The Horse Fair has been analyzed extensively since it was first exhibited, as no two viewers seem to agree about exactly what the painting means.”'], 'Only choice A identifies a before-and-after stylistic break centered on *The Horse Fair*.'),
  mc('rw2', 10, `Neurobiologists Laura Cuaya, Raúl Hernández-Pérez, and colleagues investigated the language detection abilities of eighteen dogs. The researchers monitored the brain activity of Kun-kun (a border collie), Bingo (a mixed breed), and other dogs while the animals listened to three recordings: one of *The Little Prince* being read in Spanish, the second in Hungarian, and a third made up of short, randomly selected fragments of the first two, scrambled so that they didn’t resemble human speech. Each dog was familiar with either Spanish or Hungarian, but not both. The team concluded that differences in dogs’ anatomical features may affect their ability to distinguish speech from nonspeech.

Which finding from the study, if true, would most directly support the team’s conclusion?`, 'A', ['Compared with longer-headed dogs, shorter-headed dogs showed less difference in brain activity when hearing either Spanish or Hungarian than when hearing the scrambled recording.', 'Compared with longer-headed dogs, shorter-headed dogs showed a greater difference in brain activity when hearing the language they were accustomed to than when hearing the other language.', 'Long-headed dogs accustomed to hearing Spanish tended to show more brain activity when hearing Spanish than long-headed dogs accustomed to hearing Hungarian showed when hearing Hungarian.', 'The pattern of brain activity that long-headed dogs showed when hearing the scrambled recording was different from the pattern of brain activity that short-headed dogs showed when hearing the language they were accustomed to.'], 'Choice A directly links head anatomy to the size of the neural distinction between speech and scrambled nonspeech.'),
  mc('rw2', 11, `“Poetry” is a 1919 poem by Marianne Moore. The poem highlights an ambivalence toward poetry as the speaker acknowledges its merits while also expressing a sense of displeasure, writing _______.

Which quotation from “Poetry” most effectively illustrates the claim?`, 'D', ['“nor is it valid / to discriminate against ‘business documents and / school-books’; all these phenomena are important.”', '“One must make a distinction / however: when dragged into prominence by half poets, the result is not / poetry”', '“when [poems] become so derivative as to become unintelligible, the / same thing may be said for all of us—that we / do not admire what / we cannot understand.”', '“Reading [poetry], however, with a perfect contempt for it, one discovers that there is in / it after all, a place for the genuine”'], 'Choice D contains both contempt for poetry and acknowledgment that genuine merit exists within it.'),
  mc('rw2', 12, `*Cane* is a 1923 novel by Jean Toomer. In one portion of the novel, Toomer uses figurative language to connect the narrator’s urban environment of Washington, DC, and the rural South of the narrator’s past, writing, _______.

Which quotation from *Cane* most effectively illustrates the claim?`, 'D', ['“The [train] engines of this valley have a whistle, the echoes of which sound like iterated gasps and sobs. I always think of them as crude music.”', '“I sang with a strange quiver in my voice, a promise-song.”', '“The young trees had not outgrown their [planter] boxes then. V Street [in Washington, DC] was lined with them.”', '“And when the wind is from the South, soil of my homeland falls like a fertile shower upon the lean streets of [Washington, DC].”'], 'Choice D figuratively carries Southern soil into Washington’s streets, explicitly linking the two settings.'),
  mc('rw2', 13, `Some climate models for the western United States predict that while total annual precipitation may remain unchanged from the present level, precipitation will become concentrated into fewer but more intense rain and snow events. University of Texas climate scientist Geeta Persad and her colleagues simulated how the amount of water entering aquifers and the amount being used for irrigation purposes would change if this were to occur. Persad and her colleagues concluded that concentration of precipitation into fewer events would result in a higher number of dry days, triggering more irrigation, but that this change in irrigation output is highly sensitive to the baseline concentration of precipitation that currently exists in an area.

Which choice best describes data from the table that support Persad and her colleagues’ conclusion?`, 'B', ['If baseline precipitation is somewhat concentrated, the amount of water being used for irrigation will increase 0.4% for surface water and 0.9% for groundwater, whereas the amount of water entering aquifers will increase 11.0% if baseline precipitation is evenly distributed.', 'If baseline precipitation is somewhat concentrated, water use for irrigation will increase only slightly, whereas it will increase 9.0% for surface water and 7.9% for groundwater if baseline precipitation is evenly distributed.', 'If baseline precipitation is somewhat concentrated, the amount of water entering aquifers will increase 4.9%, while the amount being used for irrigation will increase 0.4% for surface water and 0.9% for groundwater.', 'If baseline precipitation is somewhat concentrated, water use for irrigation will decline by a small amount, whereas it will increase 11.0% for surface water and 9.0% for groundwater if baseline precipitation is evenly distributed.'], 'The irrigation increases are small under the somewhat concentrated baseline but much larger under the evenly distributed baseline, directly showing sensitivity.', { asset: '/sat/may-2026-intl/visuals/rw2-13-precipitation-table.png', alt: 'Table of simulated changes in aquifer input and irrigation output under two precipitation baselines' }),
  mc('rw2', 14, `Ships in the British Royal Navy during the Napoleonic Wars (1803–1815) were ranked based on military strength. The system considered the number of a ship’s cannons and decks. “First-rate” was the highest ranking, and “sixth-rate” was the lowest ranking, followed by unranked ships. The size of a ship’s crew was based on this ranking: first-rate ships had between 850 and 875 crewmen, while lower-ranked ships had fewer. Two of the ships in the British Royal Navy from this period were the *Boyne* (98 cannons and three decks) and the *Britannia* (120 cannons and three decks). Of these two, only the *Britannia* was ranked a first-rate ship. It can therefore be concluded that _______.

Which choice most logically completes the text?`, 'A', ['some ships with three decks had a crew of fewer than 850 people.', 'the *Britannia* needed a crew larger than 875 people in order to operate efficiently.', 'the *Boyne* had a larger crew than the *Britannia*.', 'all ships with at least 98 cannons had a crew of at least 850 people.'], 'The three-deck *Boyne* was below first-rate and thus had fewer than 850 crew, proving some three-deck ships did.'),
  mc('rw2', 15, `In a 2018 study, Deepak Jaiswal and Rishi Kant found that consumers’ knowledge of environmental issues had no effect on the likelihood that the consumers would purchase environmentally friendly products. Since this study was based on fewer than 400 young adults in India, however, doubts have been raised about how reliable and representative the findings are. To better understand the issue, Wencan Zhuang and colleagues analyzed the results of 54 studies of eco-friendly consumer behavior, such as a 2018 study from Indonesia that included 916 participants and a 2018 study from India with 202 participants. Taking all 54 studies together, Zhuang and colleagues found a significant positive effect of environmental knowledge on eco-friendly purchasing decisions, suggesting that _______.

Which choice most logically completes the text?`, 'B', ['a sample size of 202 may be sufficient to make reliable conclusions about the relationship between knowledge of environmental issues and purchasing decisions.', 'concerns about the broad applicability of Jaiswal and Kant’s conclusion were justified.', 'the number of participants in Jaiswal and Kant’s study was far below the number of participants in most studies of purchasing decisions.', 'Jaiswal and Kant’s methodology was more precise than the methodology used in the 2018 study from Indonesia.'], 'The broader meta-analysis found the opposite relationship, validating doubts about generalizing the smaller study’s conclusion.'),
  mc('rw2', 16, `In Norway, the Longyearbyen observatory site monitors activity in the upper atmosphere of the northern _______ in Australia, another observatory site, Buckland Park, monitors the sky of the southern hemisphere. Together, they are part of the Super Dual Auroral Radar Network—or SuperDARN, as space physicists like Tadahiko Ogawa call it.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'D', ['hemisphere and', 'hemisphere', 'hemisphere,', 'hemisphere;'], 'A semicolon correctly joins the two closely related independent clauses about the two observatories.'),
  mc('rw2', 17, `Long attributed to Jacques-Louis David, the preeminent Neoclassical painter of his day, the 1801 painting *Marie Joséphine Charlotte du Val d’Ognes* gained fresh attention in the 1990s when art historians discovered that the painting—which depicts a solitary young woman sketching—was actually the work of little-known French portrait _______ Marie-Denise Villers (1774–1821).

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ['artist—', 'artist', 'artist:', 'artist,'], 'No punctuation should separate the occupational descriptor “artist” from the person’s name.'),
  mc('rw2', 18, `Along the hallowed walls of New York City’s Museum of Modern Art hangs 24.5-by-34.5-inch oil _______ which was created in 1964 by American artist Vija Celmins.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'C', ['painting *Gun with Hand #1*', 'painting, *Gun with Hand #1*,', 'painting *Gun with Hand #1*,', 'painting, *Gun with Hand #1*'], 'The title identifies the painting without an opening comma; a comma after the title introduces the nonrestrictive “which” clause.'),
  mc('rw2', 19, `Legal scholars James Melton and Tom Ginsburg’s analysis of de jure judicial independence and its growth over decades _______ six constitutional features that enhance such independence, including judicial tenure and selection procedure. Romania’s constitution contains one of these features.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ['have identified', 'identifies', 'are identifying', 'identify'], 'The singular subject “analysis” requires the singular verb **identifies**.'),
  mc('rw2', 20, `For Spain, a member of the North Atlantic Treaty Organization (NATO) since 1982, NATO’s principle of collective defense confers both benefits and _______ organization’s many members, nations as disparate as the US and Slovenia, are all bound to defend Spain, the reverse is also true.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'D', ['obligations; the', 'obligations. The', 'obligations, while the', 'obligations: while the'], 'A colon introduces an explanation of the obligations, and “while” properly subordinates the first part of that explanation.'),
  mc('rw2', 21, `As of 2017, Italy’s top tax rate of 55% was lower than the country’s Laffer curve peak (70%). To some economists, whether a tax cut will ultimately increase Italy’s tax revenue is dependent on the country’s position on the Laffer _______ a theoretical relationship between tax rates and revenues, the curve was famously sketched on a napkin by economist Arthur Laffer in 1974.

Which choice completes the text so that it conforms to the conventions of Standard English?`, 'B', ['curve', 'curve;', 'curve, which is', 'curve,'], 'The semicolon correctly separates two independent clauses; the second begins with an appositive describing the Laffer curve.'),
  mc('rw2', 22, `Working together with the Navajo Nation Department of Water Resources, Dr. Lahi Tsinnajinnie analyzed data about snowpack levels in the Chuska Mountains. She found that the snowpack (the amount of snow on the ground) was deepest in early March at lower elevations. At higher elevations, _______, the snowpack was deepest in mid-March.

Which choice completes the text with the most logical transition?`, 'C', ['in other words,', 'for instance,', 'on the other hand,', 'in summary,'], 'The timing at higher elevations contrasts with the timing at lower elevations, so **on the other hand** is logical.'),
  mc('rw2', 23, `Biographer Michael Gorra notes that the novelist Henry James “lived in a world of second thoughts,” frequently tinkering with his novels and stories after their initial publication. However, the differences between the 1881 first edition and the 1908 edition of his novel *A Portrait of a Lady* are extreme, even by James’s standards; _______, some critics regard the two editions as two different novels altogether.

Which choice completes the text with the most logical transition?`, 'B', ['by contrast,', 'in fact,', 'nevertheless,', 'in other words,'], 'The final statement intensifies and confirms how extreme the differences are, so **in fact** fits.'),
  mc('rw2', 24, `Scientists studying asteroid deflection have focused on secondary objects such as S/2020 (2013 PY6), a moonlet orbiting the near-Earth asteroid 2013 PY. In 2022 NASA intentionally crashed a probe into just such an object, successfully altering its orbit. Scientists have yet to demonstrate, _______, that 2013 PY6 and other primary objects would be similarly affected.

Which choice completes the text with the most logical transition?`, 'B', ['for example,', 'though,', 'likewise,', 'moreover,'], 'The success with a secondary object contrasts with the missing evidence for primary objects, so **though** is appropriate.'),
  mc('rw2', 25, `While researching a topic, a student has taken the following notes:

- Documentary TV programs in the slow TV genre consist of uninterrupted broadcasts of ordinary events in real time.
- *Nordlandsbanen: Minutt for Minutt* is a Norwegian slow TV program.
- The 10-hour-long program documented a train ride from Trondheim to Bodø.
- It first aired in 2012.
- In her book *Spectacular Television: Exploring Televisual Pleasure*, British film scholar Helen Wheatley writes that slow TV “offers ‘unspectacular’ spectacle.”

The student wants to provide a specific example of a slow TV program. Which choice most effectively uses relevant information from the notes to accomplish this goal?`, 'B', ['British film scholar Helen Wheatley writes about the slow TV genre in her book *Spectacular Television: Exploring Televisual Pleasure*.', 'An example of the slow TV genre can be seen in *Nordlandsbanen: Minutt for Minutt*, a 2012 Norwegian show featuring an uninterrupted 10-hour real-time broadcast of a train ride from Trondheim to Bodø.', 'Slow TV programs provide uninterrupted broadcasts of ordinary events, such as train rides, in real time.', 'With their uninterrupted broadcasts, slow TV programs offer what film scholar Helen Wheatley calls the “unspectacular spectacle” of ordinary events occurring in real time.'], 'Choice B names a specific program and gives concrete details showing why it is slow TV.'),
  mc('rw2', 26, `While researching a topic, a student has taken the following notes:

- Calida Garcia Rawles is an African American painter.
- She is known for her large-scale, hyperrealistic paintings depicting African American figures in water.
- *Lightness of Being* (24 × 30 in) depicts a young man with his arms outstretched floating on the right side of the canvas.
- *Lost in the Shuffle* (36 × 24 in) depicts two young men with their arms outstretched floating in the bottom left and upper right corners of the canvas.
- She paints the water with vivid blue colors, including periwinkle and cobalt.
- The mood in the paintings is placid.

Which choice most effectively uses information from the notes to emphasize the location of the figures in *Lost in the Shuffle*?`, 'B', ['While the number of figures may differ, constant among Rawles’s hyperrealistic works is the placid mood that the paintings evoke.', 'In Rawles’s painting *Lost in the Shuffle*, two young men are depicted in the bottom left and upper right corners of the canvas.', 'At 36 by 24 inches, Rawles’s *Lost in the Shuffle* is even larger than the sizable 24-by-30-inch painting *Lightness of Being*.', 'Rawles captures the water in paintings such as *Lightness of Being* and *Lost in the Shuffle* in vivid hues of periwinkle and cobalt.'], 'Choice B directly states the two figures’ locations in the painting.'),
  mc('rw2', 27, `While researching a topic, a student has taken the following notes:

- Jean-Michel Basquiat was an American artist who produced more than two thousand drawings and paintings.
- Most of his works were completed in New York City in the 1980s.
- His work *Mater* was completed in 1982.
- The work is composed of acrylic and oil stick on canvas and measures 72 inches by 84 inches.
- *Mater* was purchased by a private collection for $5.8 million in a 2009 auction.

Which choice most effectively uses information from the notes to emphasize the scope of Basquiat’s work?`, 'A', ['*Mater* is just one of more than two thousand drawings and paintings completed by American artist Jean-Michel Basquiat.', 'Though artist Jean-Michel Basquiat completed most of his two thousand-plus drawings in the 1980s, his work *Mater* is composed of acrylic and oil stick on canvas.', 'At a 2009 auction, artist Jean-Michel Basquiat’s *Mater*, composed of acrylic and oil stick on canvas, sold for $5.8 million.', 'Decades after artist Jean-Michel Basquiat completed his 1982 work *Mater*, a private collection purchased it for $5.8 million.'], 'Choice A emphasizes the breadth of Basquiat’s output by placing one work within a total of more than two thousand.'),
  mc('math1', 1, `The graph of the linear function $f$ is shown, where $y=f(x)$. What is the $y$-intercept of the graph of $f$?`, 'D', ['$(0,-4)$', '$(0,0)$', '$(0,4)$', '$(0,-6)$'], 'The line crosses the $y$-axis where $x=0$, at $y=-6$, so the intercept is $(0,-6)$.', { asset: '/sat/may-2026-intl/visuals/math1-01-line-graph.png', alt: 'Coordinate plane showing a decreasing line crossing the y-axis at negative six' }),
  mc('math1', 2, `Each rock in a collection of 70 rocks was classified as either igneous, metamorphic, or sedimentary, as shown in the frequency table. If one of these rocks is selected at random, what is the probability of selecting a rock that is igneous?`, 'A', ['$10/70$', '$10/60$', '$10/38$', '$10/22$'], 'There are 10 igneous rocks among 70 total rocks, so the probability is $10/70$.', { asset: '/sat/may-2026-intl/visuals/math1-02-rock-table.png', alt: 'Frequency table showing 10 igneous, 38 metamorphic, and 22 sedimentary rocks' }),
  mc('math1', 3, `Each side of square A has a length of 13 inches. Each side of square A is multiplied by a scale factor of 3 to create square B. What is the length, in inches, of each side of square B?`, 'D', ['10', '13', '16', '39'], 'Multiply the original side length by the scale factor: $13\\cdot3=39$ inches.'),
  mc('math1', 4, `The function $f(x)=\\frac{1}{9}(x-6)^2+3$ gives a toy car’s height above the ground $f(x)$, in inches, $x$ seconds after it started moving on an elevated track, where $0\\leq x\\leq10$. Which of the following is the best interpretation of the vertex of the graph of $y=f(x)$ in the $xy$-plane?`, 'A', ['The toy car’s minimum height was 3 inches above the ground.', 'The toy car’s minimum height was 6 inches above the ground.', 'The toy car’s height was 3 inches above the ground when it started moving.', 'The toy car’s height was 6 inches above the ground when it started moving.'], 'Vertex form gives the vertex $(6,3)$. Because the coefficient is positive, 3 is the minimum height.'),
  mc('math1', 5, `If $3x=8$, what is the value of $21x$?`, 'D', ['1', '15', '31', '56'], 'Since $21x=7(3x)$, substitute $3x=8$ to get $7\\cdot8=56$.'),
  mc('math1', 6, `A car travels at a speed of at least 25 miles per hour but no more than 50 miles per hour for a certain part of a trip. Which inequality represents this situation, where $x$ is the speed of the car, in miles per hour, on this part of the trip?`, 'C', ['$x\\geq25$', '$x\\geq50$', '$25\\leq x\\leq50$', '$x\\leq75$'], '“At least 25” gives $x\\geq25$ and “no more than 50” gives $x\\leq50$, so $25\\leq x\\leq50$.'),
  mc('math1', 7, `A list of 10 data values is shown.

$10, 14, 22, 6, 24, 26, 14, 8, 8, 8$

What is the mean of these data?`, 'C', ['8', '12', '14', '20'], 'The values sum to 140, and $140/10=14$.'),
  mc('math1', 8, `The function $f$ gives the estimated height, in feet, of a willow tree $x$ years after its height was first measured.

$f(x)=7x+3$

Which statement is the best interpretation of 3 in this context?`, 'D', ['The tree will be measured each year for 3 years.', 'The tree is estimated to grow to a maximum height of 3 feet.', 'The estimated height of the tree increased by 3 feet each year.', 'The estimated height of the tree was 3 feet when it was first measured.'], 'The constant term is $f(0)=3$, the estimated height at the initial measurement.'),
  mc('math1', 9, `Which expression is equivalent to $2x^3+8x^2y+xy^2+4y^3$?`, 'B', ['$(2x^2+4y)(x+y^2)$', '$(2x^2+y^2)(x+4y)$', '$(2x^3+y^2)(x^2+4y^3)$', '$(2x^3+y^3)(x+4y)$'], 'Group the terms: $2x^2(x+4y)+y^2(x+4y)=(2x^2+y^2)(x+4y)$.'),
  sr('math1', 10, `For the given function $f$, the graph of $y=f(x)$ in the $xy$-plane passes through the point $(0,b)$, where $b$ is a constant. What is the value of $b$?

$f(x)=x^3+8x+17$`, ['17'], 'Evaluate the function at $x=0$: $f(0)=0+0+17=17$.'),
  mc('math1', 11, `Scientists collected fallen acorns that each housed a colony of the ant species *P. ohioensis* and analyzed each colony’s structure. For any of these colonies, if the colony has $x$ worker ants, the equation $y=0.67x+2.6$, where $20\\leq x\\leq110$, gives the predicted number of larvae, $y$, in the colony. If one of these colonies has 35 worker ants, which of the following is closest to the predicted number of larvae in the colony?`, 'D', ['114', '48', '38', '26'], 'Substitute $x=35$: $0.67(35)+2.6=26.05$, which is closest to 26.'),
  mc('math1', 12, `The given equation relates the positive numbers $b$, $x$, and $y$.

$b-49=\\frac{x}{y}$

Which equation correctly expresses $x$ in terms of $b$ and $y$?`, 'B', ['$x=\\frac{by-49}{y}$', '$x=by-49y$', '$x=by-49$', '$x=\\frac{b-49}{y}$'], 'Multiply both sides by $y$: $x=y(b-49)=by-49y$.'),
  mc('math1', 13, `The solution to the given system of equations is $(x,y)$. What is the value of $24x$?

$2y=5x+16$

$-2y=7x-22$`, 'D', ['-12', '-6', '6', '12'], 'Add the equations to eliminate $y$: $0=12x-6$, so $x=1/2$ and $24x=12$.'),
  sr('math1', 14, `$19.5x+24.25y=583$

Odalys ordered mulch and river rock, which cost a total of 583 dollars, for her home. The equation represents the relationship between the number of cubic yards of mulch, $x$, and the number of tons of river rock, $y$, Odalys ordered. How much more, in dollars, did a ton of river rock cost Odalys than a cubic yard of mulch?`, ['4.75'], 'The coefficients are the unit prices. Their difference is $24.25-19.50=4.75$ dollars.'),
  mc('math1', 15, `James purchased a certain baseball card on January 1. The function $f(x)=55(1.04)^x$, where $0\\leq x\\leq10$, gives the predicted value, in dollars, of the baseball card $x$ years after James purchased it. What is the best interpretation of the statement “$f(7)$ is approximately equal to 72” in this context?`, 'D', ['When the baseball card’s predicted value is approximately 72 dollars, it is 7% greater than the predicted value on January 1 of the previous year.', 'When the baseball card’s predicted value is approximately 72 dollars, it is 7 times the predicted value on January 1 of the previous year.', 'From the day James purchased the card to 7 years after purchase, its predicted value increased by approximately 72 dollars.', 'Seven years after James purchased the baseball card, its predicted value is approximately 72 dollars.'], '$f(7)$ means the predicted value when 7 years have elapsed, so it is about 72 dollars then.'),
  mc('math1', 16, `At what value of $x$ does the graph of $y=x^2+18x-23$ reach its minimum in the $xy$-plane?`, 'B', ['-23', '-9', '9', '18'], 'For $ax^2+bx+c$, the vertex has $x=-b/(2a)=-18/2=-9$.'),
  mc('math1', 17, `The function $P$ models the population, in thousands, of a certain city $t$ years after 2009.

$P(t)=260(1.03)^{(3/2)t}$

According to the model, the population is predicted to increase by $n\\%$ every 8 months. What is the value of $n$?`, 'D', ['0.22', '1.03', '2', '3'], 'Eight months is $2/3$ year, making the exponent $(3/2)(2/3)=1$. The factor is therefore 1.03, a 3% increase.'),
  sr('math1', 18, `How many centimeters are equivalent to 47 meters? $(1\\text{ meter}=100\\text{ centimeters})$`, ['4700'], 'Multiply by 100 centimeters per meter: $47\\cdot100=4700$.'),
  sr('math1', 19, `Circle A has a radius of $3x$ and circle B has a radius of $135x$. The area of circle B is how many times the area of circle A?`, ['2025'], 'Area scales with the square of radius. The radius ratio is $135/3=45$, so the area ratio is $45^2=2025$.'),
  sr('math1', 20, `The graph of a line in the $xy$-plane passes through the point $(1,5)$ and crosses the $x$-axis at the point $(9,0)$. The line crosses the $y$-axis at the point $(0,b)$. What is the value of $b$?`, ['5.625', '45/8'], 'The slope is $(0-5)/(9-1)=-5/8$. Using $(1,5)$ gives $b=5+5/8=45/8=5.625$.'),
  sr('math1', 21, `If $\\frac{2a}{b}=6.5$ and $\\frac{a}{bn}=26$, what is the value of $n$?`, ['0.125', '.125', '1/8'], 'The first equation gives $a/b=3.25$. Then $(a/b)/n=26$, so $n=3.25/26=0.125$.'),
  mc('math1', 22, `For two acute angles, $\\angle Q$ and $\\angle R$, $\\cos(Q)=\\sin(R)$. The measures, in degrees, of $\\angle Q$ and $\\angle R$ are $x+61$ and $4x+4$, respectively. What is the value of $x$?`, 'A', ['5', '19', '23', '29'], 'For acute complementary angles, $Q+R=90$. Thus $(x+61)+(4x+4)=90$, so $5x=25$ and $x=5$.'),
  mc('math2', 1, `Which expression is equivalent to $14(x^2-6)$?`, 'A', ['$14x^2-84$', '$14x^2-20$', '$14x^2-6$', '$14x^2+8$'], 'Distribute 14: $14(x^2)-14(6)=14x^2-84$.'),
  mc('math2', 2, `A scientist analyzed a soil sample with a mass of 900 grams and determined that it contained 189 grams of water. What is the percentage of water, by mass, in this soil sample?`, 'D', ['9%', '9.9%', '18.9%', '21%'], 'Compute $189/900\\times100=21\\%$.'),
  mc('math2', 3, `At what point $(x,y)$ do the graphs of the equations in the given system intersect?

$x+5=11$

$y=3x^2+3$`, 'B', ['$(6,108)$', '$(6,111)$', '$(11,3)$', '$(11,366)$'], 'The first equation gives $x=6$. Then $y=3(6^2)+3=111$.'),
  sr('math2', 4, `If $7p+42=84$, what is the value of $7p$?`, ['42'], 'Subtract 42 from both sides to obtain $7p=42$.'),
  mc('math2', 5, `If $5(x+4)=4(x+4)+58$, what is the value of $x+4$?`, 'C', ['-4', '54', '58', '62'], 'Subtract $4(x+4)$ from both sides; the remaining equation is $x+4=58$.'),
  mc('math2', 6, `Circle N has a radius of 6 millimeters (mm). Circle M has an area of $121\\pi$ mm². What is the total area, in mm², of circles N and M?`, 'D', ['$17\\pi$', '$133\\pi$', '$145\\pi$', '$157\\pi$'], 'Circle N has area $\\pi(6^2)=36\\pi$. Adding $121\\pi$ gives $157\\pi$.'),
  mc('math2', 7, `What is the slope of the graph of $y=\\frac{1}{4}(27x+12)+7x$ in the $xy$-plane?`, 'B', ['$27/4$', '$55/4$', '27', '34'], 'Combine the $x$ coefficients: $27/4+7=27/4+28/4=55/4$.'),
  mc('math2', 8, `The function $f$ is defined by $f(x)=\\frac{x+16}{5}$, and $f(a)=-19$, where $a$ is a constant. What is the value of $a$?`, 'A', ['-111', '-79', '$-79/5$', '$-3/5$'], 'Solve $(a+16)/5=-19$: $a+16=-95$, so $a=-111$.'),
  mc('math2', 9, `A data set of the orbital periods, rounded to the nearest whole number of Earth days, for 13 of Jupiter’s moons is represented in the dot plot. An additional moon with an orbital period of 251 days is added to the original data set to create a new data set of 14 orbital periods. Which statement best compares the mean and median of the new data set to the mean and median of the original data set?`, 'D', ['The mean of the new data set is equal to the original mean, and the median of the new data set is equal to the original median.', 'The mean of the new data set is equal to the original mean, and the median of the new data set is less than the original median.', 'The mean of the new data set is less than the original mean, and the median of the new data set is less than the original median.', 'The mean of the new data set is less than the original mean, and the median of the new data set is equal to the original median.'], 'Adding 251, far below every original value, lowers the mean. The two central values of the 14-value set average to the original middle value, so the median stays the same.', { asset: '/sat/may-2026-intl/visuals/math2-09-orbital-dotplot.png', alt: 'Dot plot of 13 moon orbital periods ranging from 720 to 732 days' }),
  mc('math2', 10, `For the linear function $p$, $p(c)=-2$, where $c$ is a constant, $p(5)=34$, and the slope of the graph of $y=p(x)$ in the $xy$-plane is 6. For the linear function $t$, $t(c)=-4$ and $t(6)=52$. What is the slope of the graph of $y=t(x)$ in the $xy$-plane?`, 'D', ['-1', '4', '6', '8'], 'For $p$, $(34-(-2))/(5-c)=6$, so $c=-1$. Then the slope of $t$ is $(52-(-4))/(6-(-1))=56/7=8$.'),
  sr('math2', 11, `$18x^2-24x+c=0$

In the given equation, $c$ is a constant. The equation has exactly one solution. What is the value of $c$?`, ['8'], 'Exactly one solution requires discriminant zero: $(-24)^2-4(18)c=0$, so $576=72c$ and $c=8$.'),
  mc('math2', 12, `A conservation specialist hung artificial nesting structures, each in the shape of a right rectangular prism, for a species of native owl. Each structure has a height of 11 inches. The length of each structure’s base is $x$ inches, which is 1 inch more than the width of the structure’s base. Which function $V$ gives the volume of each structure, in cubic inches, in terms of the length of the structure’s base?`, 'A', ['$V(x)=11x(x-1)$', '$V(x)=11x(x+1)$', '$V(x)=x(x+11)(x-1)$', '$V(x)=x(x+11)(x+1)$'], 'The dimensions are height 11, length $x$, and width $x-1$, so $V=11x(x-1)$.'),
  mc('math2', 13, `The function $f$ is defined by $f(x)=-39^x$. The function $g$ is a decreasing linear function. In the $xy$-plane, the graphs of $y=f(x)$ and $y=g(x)$ intersect at two points, $(h,j)$ and $(k,m)$, where $j>m$. When $g(x)<f(x)$, which of the following must also be true?`, 'D', ['$x>k$', '$x<h$', '$x>k$ or $x<h$', '$h<x<k$'], 'The decreasing line lies below the concave-down exponential curve between their two intersection x-values, so $h<x<k$.'),
  mc('math2', 14, `One gallon of sealant costs 29 dollars and will cover 300 square feet of a surface. A deck has a total surface area of $d$ square feet. Which equation represents the cost $c$, in dollars, of the sealant needed to cover the deck twice?`, 'C', ['$c=\\frac{300d}{29}$', '$c=\\frac{600d}{29}$', '$c=29\\left(\\frac{d}{150}\\right)$', '$c=29\\left(\\frac{d}{300}\\right)$'], 'Two coats cover $2d$ square feet, requiring $2d/300=d/150$ gallons. At 29 dollars per gallon, $c=29(d/150)$.'),
  sr('math2', 15, `A triangular prism has a height of 9 centimeters (cm) and a volume of 234 cm³. What is the area, in cm², of the base of the prism? (The volume of a triangular prism is equal to $Bh$, where $B$ is the area of the base and $h$ is the height of the prism.)`, ['26'], 'Use $234=B(9)$, so $B=234/9=26$.'),
  sr('math2', 16, `An area of 56.00 square nautical miles is equivalent to $k$ square kilometers. To the nearest tenth, what is the value of $k$? $(1\\text{ nautical mile}=1.852\\text{ kilometers})$`, ['192.1'], 'Square the linear conversion: $56(1.852)^2=192.068224$, which rounds to 192.1.'),
  sr('math2', 17, `A circle in the $xy$-plane has its center at $(-7,3)$ and has a radius of 9. An equation of this circle is $x^2+y^2+ax+by+c=0$, where $a$, $b$, and $c$ are constants. What is the value of $c$?`, ['-23'], 'Expand $(x+7)^2+(y-3)^2=81$. The constant is $49+9-81=-23$.'),
  mc('math2', 18, `In the given system of equations, $c$ is a constant. The system has two distinct real solutions. Which of the following could be the value of $c$?

$y=x-c$

$y=-4(x-6)^2$`, 'C', ['1', '5', '6', '-2'], 'Equating the formulas gives $4x^2-47x+(144-c)=0$. Two solutions require $(-47)^2-16(144-c)>0$, or $c>95/16$. Only 6 qualifies.'),
  mc('math2', 19, `The functions $f$ and $g$ are defined by the equations shown, where $a$ and $b$ are integer constants, $a<b$, and $b<0$. If $y=f(x)$ and $y=g(x)$ are graphed in the $xy$-plane, which of the following equations displays, as a constant or coefficient, the $y$-coordinate of the $y$-intercept of the graph of the corresponding function?

I. $f(x)=a(4.2)^{(x+b)/a}$

II. $g(x)=a(4.2)^x+b$`, 'D', ['I only', 'II only', 'I and II', 'Neither I nor II'], 'At $x=0$, the intercepts are $a(4.2)^{b/a}$ and $a+b$; neither is displayed as a single constant or coefficient in its equation.'),
  mc('math2', 20, `For each real number $r$, which of the following points lies on the graph of each equation in the $xy$-plane for the given system?

$5x+4y=3$

$15x+12y=9$`, 'C', ['$(r,-\\frac{4r}{5}+\\frac{3}{5})$', '$(r,\\frac{5r}{4}+\\frac{3}{4})$', '$(-\\frac{4r}{5}+\\frac{3}{5},r)$', '$(r+3,-\\frac{r}{3}+9)$'], 'The second equation is three times the first. Let $y=r$ in $5x+4y=3$; then $x=-4r/5+3/5$, giving choice C.'),
  mc('math2', 21, `In triangle ABC and triangle DEF, sides $AB$ and $DE$ each have a side length of 10 inches, and angles $A$ and $D$ each have an angle measure of $40°$. Which of the following additional pieces of information is(are) sufficient to prove whether triangle ABC is congruent to triangle DEF?

I. The measures of angles $B$ and $C$ are equal.

II. The lengths of sides $AC$ and $DF$ are equal.

III. The lengths of sides $BC$ and $EF$ are equal.`, 'B', ['I only', 'II only', 'III only', 'II and III only'], 'Statement II supplies a second corresponding side around the equal included angle, proving congruence by SAS. I compares angles within one triangle, and III creates ambiguous SSA.'),
  sr('math2', 22, `In the given equation, $k$ is a constant. The solution to the equation is $\\frac{1}{224}$. What is the value of $k$?

$\\frac{x+1}{5x^2}=\\frac{k}{x}$`, ['45'], 'Multiply by $5x^2$: $x+1=5kx$. With $x=1/224$, $225/224=5k/224$, so $225=5k$ and $k=45$.'),
]
