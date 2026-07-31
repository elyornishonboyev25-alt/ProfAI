import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  AcademicCapIcon,
  ChartBarIcon,
  SparklesIcon,
  TrophyIcon,
  ArrowRightIcon,
  PlayIcon,
  BookOpenIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/solid'
import FullReadingTests from '../components/FullReadingTests'

export default function Home() {
  const { t } = useTranslation()

  const features = [
    {
      icon: ChartBarIcon,
      title: t('home.features.adaptive'),
      description: 'Personalized learning paths that adapt to your skill level and progress.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: SparklesIcon,
      title: t('home.features.ai'),
      description: 'AI-powered evaluation and feedback for writing and speaking tests.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: TrophyIcon,
      title: t('home.features.gamification'),
      description: 'Earn points, badges, and climb leaderboards while learning.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: BookOpenIcon,
      title: t('home.features.progress'),
      description: 'Detailed analytics and insights to track your improvement over time.',
      color: 'from-orange-500 to-orange-600'
    }
  ]

  const stats = [
    { label: 'Active Students', value: '10,000+' },
    { label: 'Tests Completed', value: '50,000+' },
    { label: 'Average Score Improvement', value: '20%' },
    { label: 'Success Rate', value: '85%' }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'SAT Student',
      content: 'ProfAI helped me improve my SAT score by 200 points. The adaptive learning system is amazing!',
      rating: 5
    },
    {
      name: 'Ahmed Karim',
      role: 'IELTS Candidate',
      content: 'The AI writing evaluation gave me detailed feedback that helped me achieve Band 8 in IELTS.',
      rating: 5
    },
    {
      name: 'Maria Garcia',
      role: 'Math Olympiad',
      content: 'The challenging problems and clear explanations prepared me for the International Math Olympiad.',
      rating: 5
    }
  ]

  return (
    <div className="workspace-page min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AcademicCapIcon className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              {t('home.title')}
              <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2 text-primary-500">
                {t('home.subtitle')}
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10"
            >
              {t('home.description')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/tests"
                className="btn btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
              >
                {t('home.getStarted')}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/dashboard"
                className="btn btn-secondary text-lg px-8 py-3 inline-flex items-center justify-center"
              >
                {t('home.exploreTests')}
                <PlayIcon className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose ProfAI?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the future of test preparation with our innovative features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Exam Preparation Categories
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive preparation for all major standardized tests.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'School Tests', href: '/tests', icon: BookOpenIcon, color: 'from-blue-500 to-blue-600' },
              { name: 'SAT Prep', href: '/sat', icon: AcademicCapIcon, color: 'from-red-500 to-red-600' },
              { name: 'IELTS Prep', href: '/ielts', icon: GlobeAltIcon, color: 'from-green-500 to-green-600' },
              { name: 'Writing Lab', href: '/writing-lab', icon: TrophyIcon, color: 'from-purple-500 to-purple-600' }
            ].map((category) => (
              <Link
                key={category.name}
                to={category.href}
                className="group card p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Start practicing now
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Students Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of successful students who achieved their goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-8"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already improving their scores with ProfAI.
          </p>
          <Link
            to="/tests"
            className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3 inline-flex items-center"
          >
            Get Started Now
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <FullReadingTests />
    </div>
  )
}

