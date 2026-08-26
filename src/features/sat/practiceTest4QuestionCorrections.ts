export type SATStructuredChoice = { key: string; text: string; image?: string }

export type SATQuestionContentOverride = {
  prompt?: string
  choices?: SATStructuredChoice[]
  visual?: { asset: string; alt: string }
}

const choices = (a: string, b: string, c: string, d: string): SATStructuredChoice[] => [
  { key: 'A', text: a },
  { key: 'B', text: b },
  { key: 'C', text: c },
  { key: 'D', text: d },
]

/**
 * PDF text extraction is exact for prose, but mathematical typesetting can split
 * fractions, radicals, exponents, and answer choices into separate glyph runs.
 * These checked overrides preserve the official Practice Test 4 notation in a
 * screen-reader-friendly text form while keeping diagrams as focused visuals.
 */
export const SAT_PRACTICE_TEST_4_CONTENT_OVERRIDES: Record<string, SATQuestionContentOverride> = {
  'rw1-13': {
    visual: { asset: '/sat/practice-test-4/visuals/rw1-13-graph.webp', alt: 'Bar graph of US states with the greatest number of organic farms in 2016' },
  },
  'rw1-15': {
    visual: { asset: '/sat/practice-test-4/visuals/rw1-15-table.webp', alt: 'Table of ablation rates for three elements in cosmic dust' },
  },
  'rw1-17': {
    visual: { asset: '/sat/practice-test-4/visuals/rw1-17-table.webp', alt: 'Table showing the effects of mycorrhizal fungi on three plant species' },
  },
  'rw2-13': {
    prompt: `High levels of public uncertainty about which economic policies a country will adopt can make planning difficult for businesses, but measures of such uncertainty have not tended to be very detailed. Recently, however, economist Sandile Hlatswayo analyzed trends in news reports to derive measures not only for general economic policy uncertainty but also for uncertainty related to specific areas of economic policy, like tax or trade policy. One revelation of her work is that a general measure may not fully reflect uncertainty about specific areas of policy, as in the case of the United Kingdom, where general economic policy uncertainty _______

Which choice most effectively uses data from the graph to illustrate the claim?`,
    choices: choices(
      'aligned closely with uncertainty about tax and public spending policy in 2005 but differed from uncertainty about tax and public spending policy by a large amount in 2009.',
      'was substantially lower than uncertainty about tax and public spending policy each year from 2005 to 2010.',
      'reached its highest level between 2005 and 2010 in the same year that uncertainty about trade policy and tax and public spending policy reached their lowest levels.',
      'was substantially lower than uncertainty about trade policy in 2005 and substantially higher than uncertainty about trade policy in 2010.',
    ),
    visual: { asset: '/sat/practice-test-4/visuals/rw2-13-graph.webp', alt: 'Bar graph of economic policy uncertainty in the United Kingdom from 2005 to 2010' },
  },
  'math1-1': {
    prompt: 'A group of students voted on five after-school activities. The bar graph shows the number of students who voted for each of the five activities. How many students chose activity 3?',
    visual: { asset: '/sat/practice-test-4/visuals/math1-01-chart.webp', alt: 'Bar graph showing votes for five after-school activities' },
  },
  'math1-3': {
    prompt: '$$\\frac{x^2}{25} = 36$$\n\nWhat is a solution to the given equation?',
  },
  'math1-4': {
    choices: choices('$(3)(8)x = 83$', '$8x = 83 + 3$', '$3x + 8 = 83$', '$8x + 3 = 83$'),
  },
  'math1-5': {
    prompt: 'Hana deposited a fixed amount into her bank account each month. The function $f(t) = 100 + 25t$ gives the amount, in dollars, in Hana’s bank account after $t$ monthly deposits. What is the best interpretation of 25 in this context?',
  },
  'math1-6': {
    prompt: 'A customer spent $27 to purchase oranges at $3 per pound. How many pounds of oranges did the customer purchase?',
  },
  'math1-7': {
    prompt: 'Nasir bought 9 storage bins that were each the same price. He used a coupon for $63 off the entire purchase. The cost after using the coupon was $27. What was the original price, in dollars, for 1 storage bin?',
  },
  'math1-8': {
    prompt: 'For the linear function f, the table shows three values of x and their corresponding values of f(x). Which equation defines f(x)?',
    choices: choices('$f(x) = 3x + 29$', '$f(x) = 29x + 32$', '$f(x) = 35x + 29$', '$f(x) = 32x + 35$'),
    visual: { asset: '/sat/practice-test-4/visuals/math1-08-table.webp', alt: 'Table where x values 0, 1, and 2 correspond to f(x) values 29, 32, and 35' },
  },
  'math1-9': {
    prompt: 'Right triangles PQR and STU are similar, where P corresponds to S. If the measure of angle Q is 18°, what is the measure of angle S?',
    choices: choices('$18^\\circ$', '$72^\\circ$', '$82^\\circ$', '$162^\\circ$'),
    visual: { asset: '/sat/practice-test-4/visuals/math1-09-figure.webp', alt: 'Two similar right triangles labeled PQR and STU' },
  },
  'math1-10': {
    prompt: 'The scatterplot shows the relationship between two variables, x and y. Which equation is the most appropriate linear model for the data shown?',
    choices: choices('$y = 0.9 + 9.4x$', '$y = 0.9 - 9.4x$', '$y = 9.4 + 0.9x$', '$y = 9.4 - 0.9x$'),
    visual: { asset: '/sat/practice-test-4/visuals/math1-10-plot.webp', alt: 'Scatterplot showing a negative association between x and y' },
  },
  'math1-11': {
    prompt: '$$2.5b + 5r = 80$$\n\nThe given equation describes the relationship between the number of birds, $b$, and the number of reptiles, $r$, that can be cared for at a pet care business on a given day. If the business cares for 16 reptiles on a given day, how many birds can it care for on this day?',
  },
  'math1-12': {
    prompt: 'What is an equation of the graph shown?',
    choices: choices('$y = -2x - 8$', '$y = x - 8$', '$y = -x - 8$', '$y = 2x - 8$'),
    visual: { asset: '/sat/practice-test-4/visuals/math1-12-graph.webp', alt: 'Coordinate graph of a decreasing line crossing the y-axis at negative 8' },
  },
  'math1-13': {
    prompt: 'If $\\frac{x}{8} = 5$, what is the value of $\\frac{8}{x}$?',
  },
  'math1-14': {
    prompt: '$$24x + y = 48$$\n\n$$6x + y = 72$$\n\nThe solution to the given system of equations is $(x, y)$. What is the value of $y$?',
  },
  'math1-15': {
    prompt: 'Line $t$ in the $xy$-plane has a slope of $-\\frac{1}{3}$ and passes through the point $(9, 10)$. Which equation defines line $t$?',
    choices: choices('$y = 13x - 3$', '$y = 9x + 10$', '$y = -\\frac{x}{3} + 10$', '$y = -\\frac{x}{3} + 13$'),
  },
  'math1-16': {
    prompt: 'The function $f(x) = 206(1.034)^x$ models the value, in dollars, of a certain bank account by the end of each year from 1957 through 1972, where $x$ is the number of years after 1957. Which choice is the best interpretation of “$f(5)$ is approximately equal to 243” in this context?',
  },
  'math1-17': {
    prompt: 'For a certain rectangular region, the ratio of its length to its width is 35 to 10. If the width of the rectangular region increases by 7 units, how must the length change to maintain this ratio?',
  },
  'math1-18': {
    prompt: 'Square P has a side length of x inches. Square Q has a perimeter that is 176 inches greater than the perimeter of square P. The function f gives the area of square Q, in square inches. Which choice defines f?',
    choices: choices('$f(x) = (x + 44)^2$', '$f(x) = (x + 176)^2$', '$f(x) = (176x + 44)^2$', '$f(x) = (176x + 176)^2$'),
  },
  'math1-19': {
    prompt: '$$\\frac{14x}{7y} = 2\\sqrt{w + 19}$$\n\nThe given equation relates the distinct positive real numbers $w$, $x$, and $y$. Which equation correctly expresses $w$ in terms of $x$ and $y$?',
    choices: choices('$w = \\sqrt{\\frac{x}{y}} - 19$', '$w = \\sqrt{\\frac{28x}{14y}} - 19$', '$w = \\left(\\frac{x}{y}\\right)^2 - 19$', '$w = \\left(\\frac{28x}{14y}\\right)^2 - 19$'),
  },
  'math1-20': {
    prompt: 'Point $O$ is the center of a circle. The measure of arc $RS$ on this circle is $100^\\circ$. What is the measure, in degrees, of its associated angle $ROS$?',
  },
  'math1-21': {
    prompt: 'The expression $6 \\cdot \\sqrt[5]{3^5x^{45}} \\cdot \\sqrt[8]{2^8x}$ is equivalent to $ax^b$, where $a$ and $b$ are positive constants and $x > 1$. What is the value of $a + b$?',
  },
  'math1-22': {
    prompt: 'A right triangle has sides of length $2\\sqrt{2}$, $6\\sqrt{2}$, and $\\sqrt{80}$ units. What is the area of the triangle, in square units?',
    choices: choices('$8\\sqrt{2} + \\sqrt{80}$', '$12$', '$24\\sqrt{80}$', '$24$'),
  },
  'math1-23': {
    prompt: 'The expression $4x^2 + bx - 45$, where $b$ is a constant, can be rewritten as $(hx + k)(x + j)$, where $h$, $k$, and $j$ are integer constants. Which of the following must be an integer?',
    choices: choices('$\\frac{b}{h}$', '$\\frac{b}{k}$', '$\\frac{45}{h}$', '$\\frac{45}{k}$'),
  },
  'math1-24': {
    prompt: '$$y = 2x^2 - 21x + 64$$\n\n$$y = 3x + a$$\n\nIn the given system of equations, $a$ is a constant. The graphs intersect at exactly one point $(x, y)$ in the $xy$-plane. What is the value of $x$?',
  },
  'math1-25': {
    prompt: 'An isosceles right triangle has a hypotenuse of length 58 inches. What is the perimeter, in inches, of this triangle?',
    choices: choices('$29\\sqrt{2}$', '$58\\sqrt{2}$', '$58 + 58\\sqrt{2}$', '$58 + 116\\sqrt{2}$'),
  },
  'math1-26': {
    prompt: 'In the $xy$-plane, a parabola has vertex $(9, -14)$ and intersects the $x$-axis at two points. If its equation is written as $y = ax^2 + bx + c$, where $a$, $b$, and $c$ are constants, which choice could be the value of $a + b + c$?',
  },
  'math1-27': {
    prompt: 'Function $f$ is defined by $f(x) = -a^x + b$, where $a$ and $b$ are constants. In the $xy$-plane, the graph of $y = f(x) - 15$ has a $y$-intercept at $\\left(0, -\\frac{99}{7}\\right)$. The product of $a$ and $b$ is $\\frac{65}{7}$. What is the value of $a$?',
  },
  'math2-1': {
    prompt: 'The line graph shows the estimated number of chipmunks in a state park on April 1 of each year from 1989 to 1999. Based on the graph, in which year was the estimated number of chipmunks the greatest?',
    visual: { asset: '/sat/practice-test-4/visuals/math2-01-graph.webp', alt: 'Line graph of estimated chipmunk population from 1989 to 1999' },
  },
  'math2-2': {
    prompt: 'A fish swam a distance of 5,104 yards. How far did the fish swim, in miles? (1 mile = 1,760 yards)',
  },
  'math2-3': {
    prompt: 'Which expression is equivalent to $12x^3 - 5x^3$?',
    choices: choices('$7x^6$', '$17x^3$', '$7x^3$', '$17x^6$'),
  },
  'math2-4': {
    prompt: '$$x + y = 18$$\n\n$$5y = x$$\n\nWhat is the solution $(x, y)$ to the given system of equations?',
    choices: choices('$(15, 3)$', '$(16, 2)$', '$(17, 1)$', '$(18, 0)$'),
  },
  'math2-5': {
    prompt: 'The point $(8, 2)$ in the $xy$-plane is a solution to which of the following systems of inequalities?',
    choices: choices('$x > 0$\n$y > 0$', '$x > 0$\n$y < 0$', '$x < 0$\n$y > 0$', '$x < 0$\n$y < 0$'),
  },
  'math2-6': {
    prompt: '$$|x - 5| = 10$$\n\nWhat is one possible solution to the given equation?',
  },
  'math2-7': {
    prompt: '$$f(x) = 7x + 1$$\n\nThe function gives the total number of people on a company retreat with $x$ managers. What is the total number of people on a company retreat with 7 managers?',
  },
  'math2-8': {
    prompt: '$$h(x) = x^2 - 3$$\n\nWhich table gives three values of $x$ and their corresponding values of $h(x)$ for the given function $h$?',
    choices: choices('$x$: 1, 2, 3\n$h(x)$: 4, 5, 6', '$x$: 1, 2, 3\n$h(x)$: -2, 1, 6', '$x$: 1, 2, 3\n$h(x)$: -1, 1, 3', '$x$: 1, 2, 3\n$h(x)$: -2, 1, 3'),
  },
  'math2-9': {
    prompt: 'The function $f$ is defined by $f(x) = 270(0.1)^x$. What is the value of $f(0)$?',
  },
  'math2-10': {
    prompt: 'To estimate the proportion of a population that has a certain characteristic, a random sample was selected from the population. Based on the sample, it is estimated that the proportion of the population that has the characteristic is 0.49, with an associated margin of error of 0.04. Based on this estimate and margin of error, which choice is the most appropriate conclusion about the proportion of the population that has the characteristic?',
  },
  'math2-11': {
    prompt: 'A moving truck can tow a trailer if the combined weight of the trailer and the boxes it contains is no more than 4,600 pounds. What is the maximum number of boxes this truck can tow in a trailer with a weight of 500 pounds if each box weighs 120 pounds?',
  },
  'math2-12': {
    prompt: '$$-4x^2 - 7x = -36$$\n\nWhat is the positive solution to the given equation?',
    choices: choices('$\\frac{7}{4}$', '$\\frac{9}{4}$', '$4$', '$7$'),
  },
  'math2-13': {
    prompt: 'The table summarizes the distribution of color and shape for 100 tiles of equal area. If one tile is selected at random, what is the probability of selecting a red tile? Express your answer as a decimal or fraction, not as a percent.',
    visual: { asset: '/sat/practice-test-4/visuals/math2-13-table.webp', alt: 'Table showing tile counts by color and shape' },
  },
  'math2-14': {
    prompt: '$$f(x) = 2x + 3$$\n\nFor the given function $f$, the graph of $y = f(x)$ in the $xy$-plane is parallel to line $j$. What is the slope of line $j$?',
  },
  'math2-15': {
    prompt: 'A proposal for a new library was included on an election ballot. A radio show stated that 3 times as many people voted in favor of the proposal as people who voted against it. A social media post reported that 15,000 more people voted in favor of the proposal than voted against it. Based on these data, how many people voted against the proposal?',
  },
  'math2-16': {
    prompt: 'In the figure, lines m and n are parallel. If x = 6k + 13 and y = 8k - 29, what is the value of z?',
    visual: { asset: '/sat/practice-test-4/visuals/math2-16-figure.webp', alt: 'Parallel lines m and n crossed by transversal t, with angles x, y, and z labeled' },
  },
  'math2-17': {
    prompt: '$$-3x + 21px = 84$$\n\nIn the given equation, $p$ is a constant. The equation has no solution. What is the value of $p$?',
    choices: choices('$0$', '$\\frac{1}{7}$', '$\\frac{4}{3}$', '$4$'),
  },
  'math2-18': {
    prompt: '$$f(x) = (x - 10)(x + 13)$$\n\nFor what value of $x$ does $f(x)$ reach its minimum?',
    choices: choices('$-130$', '$-13$', '$-\\frac{23}{2}$', '$-\\frac{3}{2}$'),
  },
  'math2-19': {
    prompt: 'The function $f(x) = \\frac{1}{9}(x - 7)^2 + 3$ gives a metal ball’s height above the ground $f(x)$, in inches, $x$ seconds after it started moving on a track, where $0 \\leq x \\leq 10$. Which choice is the best interpretation of the vertex of the graph of $y = f(x)$ in the $xy$-plane?',
  },
  'math2-20': {
    prompt: 'In triangle $JKL$, $\\cos(K) = \\frac{24}{51}$ and angle $J$ is a right angle. What is the value of $\\cos(L)$?',
  },
  'math2-21': {
    prompt: '$$-x^2 + bx - 676 = 0$$\n\nIn the given equation, $b$ is a positive integer. The equation has no real solution. What is the greatest possible value of $b$?',
  },
  'math2-22': {
    prompt: 'If a new graph of three linear equations is created using the system of equations shown and the equation x + 4y = -16, how many solutions (x, y) will the resulting system have?',
    visual: { asset: '/sat/practice-test-4/visuals/math2-22-graph.webp', alt: 'Coordinate graph showing two lines from a system of equations' },
  },
  'math2-23': {
    prompt: '$$f(x) = 5,470(0.64)^{\\frac{x}{12}}$$\n\nThe function $f$ gives the value, in dollars, of a piece of equipment after $x$ months of use. If its value decreases each year by $p\\%$ of its value the preceding year, what is $p$?',
  },
  'math2-24': {
    prompt: 'The dot plot represents the 15 values in data set A. Data set B is created by adding 56 to each value in data set A. Which choice correctly compares the medians and ranges of data sets A and B?',
    visual: { asset: '/sat/practice-test-4/visuals/math2-24-plot.webp', alt: 'Dot plot of data set A with values from 22 through 26' },
  },
  'math2-25': {
    prompt: 'The equation $x^2 + (y - 1)^2 = 49$ represents circle $A$. Circle $B$ is obtained by shifting circle $A$ down 2 units in the $xy$-plane. Which equation represents circle $B$?',
    choices: choices('$(x - 2)^2 + (y - 1)^2 = 49$', '$x^2 + (y - 3)^2 = 49$', '$(x + 2)^2 + (y - 1)^2 = 49$', '$x^2 + (y + 1)^2 = 49$'),
  },
  'math2-26': {
    prompt: 'Two identical rectangular prisms each have a height of 90 centimeters. The base of each prism is a square, and the surface area of each prism is $K$ cm². If the prisms are glued together along a square base, the resulting prism has a surface area of $\\frac{92}{47}K$ cm². What is the side length, in centimeters, of each square base?',
    choices: choices('4', '8', '9', '16'),
  },
}
