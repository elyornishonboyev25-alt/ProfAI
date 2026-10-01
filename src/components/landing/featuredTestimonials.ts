import type { LandingReview } from '@/lib/reviewsApi'

// Testimonials and attribution supplied and confirmed by ProfAI. No rating or date is inferred.
export type DisplayReview = Omit<LandingReview, 'createdAt'> & { createdAt?: string }

export const featuredTestimonials: DisplayReview[] = [
  {
    id: 'featured-azizbek', name: 'Wiynsara', exam: 'SAT', rating: null,
    bandBefore: '1180', bandAfter: '1450',
    text: 'I started with a 1180 on the SAT and honestly had no idea how to improve efficiently. ProfAI helped me understand exactly where I was losing points and what I needed to work on. After following the recommendations and reviewing my mistakes consistently, I reached 1450. The biggest difference was having a clear direction instead of just doing random practice tests.',
  },
  {
    id: 'featured-madina', name: 'Sardor Qurbonov', exam: 'IELTS', rating: null,
    bandBefore: '6.0', bandAfter: '7.5',
    text: 'Before using ProfAI, I was studying for IELTS without really knowing whether I was improving. My biggest problem was Writing and I kept making the same mistakes. ProfAI helped me identify those weak areas and structure my preparation much better. I improved from an overall 6.0 to 7.5, which was the score I had been working toward.',
  },
  {
    id: 'featured-muhammadali', name: 'Khodirqulov', exam: 'SAT', rating: null,
    bandBefore: '1240', bandAfter: '1510',
    text: 'The thing I liked most about ProfAI was how easy it was to see my actual weaknesses. I was already doing well in Math, but my English score was holding me back. Instead of spending hours on things I already knew, I could focus on the areas that actually needed improvement. My SAT score went from 1240 to 1510.',
  },
  {
    id: 'featured-sevinch', name: 'Sevara Abdumavlonova', exam: 'IELTS', rating: null,
    bandBefore: '5.5', bandAfter: '7.0',
    text: 'I used to feel like my IELTS preparation was all over the place. I would study one skill one day and completely forget about it the next. ProfAI gave me a much more organized way to prepare and helped me track my progress. Over time, my score improved from 5.5 to 7.0. More importantly, I finally felt like I knew what I was doing.',
  },
  {
    id: 'featured-bekzod', name: 'Firdavz Alimkulov', exam: 'SAT', rating: null,
    bandBefore: '1320', bandAfter: '1490',
    text: 'I had taken several SAT practice tests before, but my score was stuck around the same level. ProfAI helped me look at my mistakes differently. Instead of simply checking the correct answer, I started understanding why I was getting questions wrong. That changed my preparation completely. I went from 1320 to 1490.',
  },
  {
    id: 'featured-ziyoda', name: 'Javohir Shavkatov', exam: 'IELTS', rating: null,
    bandBefore: '6.0', bandAfter: '7.0',
    text: 'My goal was a 7.0, but I kept getting around 6.0–6.5 in practice. ProfAI helped me see the specific patterns behind my mistakes, especially in Reading and Writing. After consistently working on those areas, I achieved 7.0 overall. The progress felt much more measurable than my previous preparation.',
  },
  {
    id: 'featured-umar', name: 'Amirbek Mansurov', exam: 'SAT', rating: null,
    bandBefore: '1150', bandAfter: '1400',
    text: 'ProfAI made SAT preparation feel much less overwhelming. I could clearly see what I had already mastered and where I still needed practice. I especially liked being able to track my progress over time instead of relying on how I felt about my preparation. I improved from 1150 to 1400.',
  },
  {
    id: 'featured-malika', name: 'Navruz', exam: 'IELTS', rating: null,
    bandBefore: '6.5', bandAfter: '7.5',
    text: 'I had studied IELTS before, but I never had a clear system for improving. ProfAI gave me a structured way to prepare and helped me focus on the skills that were actually limiting my score. My overall IELTS result increased from 6.5 to 7.5. It made my preparation much more focused and consistent.',
  },
  {
    id: 'featured-javohir', name: 'Jaloliddin Musaev', exam: 'SAT', rating: null,
    bandBefore: '1270', bandAfter: '1460',
    text: 'I was especially struggling with SAT Reading and Writing, and I felt like doing more questions alone wasn’t solving the problem. ProfAI helped me understand my weak areas and organize my practice around them. After several weeks of consistent preparation, I improved from 1270 to 1460.',
  },
  {
    id: 'featured-nilufar', name: 'Dovlatbek Erkinov', exam: 'IELTS', rating: null,
    bandBefore: '5.5', bandAfter: '7.0',
    text: 'What I appreciated about ProfAI was that it didn’t make preparation feel like endless practice. I could actually see my progress and understand which areas needed more attention. I started at 5.5 overall and eventually reached 7.0. Having a clear picture of my progress kept me motivated throughout the process.',
  },
  {
    id: 'featured-sardor', name: 'Murtozbek456', exam: 'SAT', rating: null,
    bandBefore: '1210', bandAfter: '1430',
    text: 'My first SAT practice score was 1210, and I wasn’t sure how realistic a 1400+ score was for me. ProfAI helped me break the preparation into smaller, more manageable areas and made it easier to track my improvement. After working consistently, I reached 1430. The biggest improvement wasn’t just my score — it was the way I approached the test.',
  },
  {
    id: 'featured-mohira', name: 'Sitora Muhiddinova', exam: 'IELTS', rating: null,
    bandBefore: '6.0', bandAfter: '7.5',
    text: 'I had been preparing for IELTS on and off for quite a while, but my results weren’t changing much. ProfAI helped me turn my preparation into a consistent routine and showed me where I was making repeated mistakes. I improved from 6.0 to 7.5, and for me, seeing that progress step by step made a huge difference.',
  },
]
