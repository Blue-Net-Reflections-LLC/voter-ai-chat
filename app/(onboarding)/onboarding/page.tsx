"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  UserIcon, 
  BookOpenIcon, 
  MegaphoneIcon, 
  NewspaperIcon, 
  UserPlusIcon 
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import { createProfile } from '../actions'

const roles = [
  {
    id: 'voter',
    name: 'REGISTERED VOTER',
    description: 'Access your voter registration status and district information',
    Icon: UserIcon,
  },
  {
    id: 'researcher',
    name: 'RESEARCHER',
    description: 'Analyze voter registration patterns and demographics',
    Icon: BookOpenIcon,
  },
  {
    id: 'canvasser',
    name: 'CANVASSER',
    description: 'Get insights for voter outreach and canvassing planning',
    Icon: MegaphoneIcon,
  },
  {
    id: 'media',
    name: 'NEWS MEDIA',
    description: 'Access data for election coverage and voter trends',
    Icon: NewspaperIcon,
  },
  {
    id: 'candidate',
    name: 'POLITICIAN/CANDIDATE',
    description: 'Understand your constituency and voter demographics',
    Icon: UserPlusIcon,
  },
]

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { data: session } = useSession()

  const handleNext = async () => {
    if (!selectedRole || !session?.user?.id) {
      setError('You must be logged in to select a role')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      await createProfile(session.user.id, selectedRole)
      router.push('/chat')
    } catch (error) {
      console.error('Failed to save user role:', error)
      setError('Failed to save your role. Please try again.')
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D0F13] to-[#1C1F26] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="space-y-6 max-w-3xl">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-medium tracking-tight">
              👋 Hello! {session?.user?.name || 'there'}
            </h1>
            <h2 className="text-3xl md:text-4xl font-normal text-gray-200">
              I am VoterAI, your dedicated intelligent assistant.
            </h2>
          </div>
          <p className="text-xl md:text-2xl text-gray-400 leading-relaxed">
            Take a minute to help me understand you better, and I will provide you with more personalized services.
          </p>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`group relative p-8 cursor-pointer transition-all duration-200 bg-[#1C1F26]/50 hover:bg-[#272B33] border-[#2B2F37] hover:border-blue-500/50 backdrop-blur-sm ${
                selectedRole === role.id ? 'ring-2 ring-blue-500 bg-[#272B33]' : ''
              }`}
              onClick={() => !isLoading && setSelectedRole(role.id)}
            >
              <div className="absolute top-6 left-8">
                <h3 className="text-base font-semibold tracking-wider text-gray-300">
                  {role.name}
                </h3>
              </div>
              <div className="flex flex-col items-center text-center pt-12 space-y-6">
                <div className="w-32 h-32 flex items-center justify-center bg-gradient-to-b from-blue-500/20 to-blue-500/10 rounded-2xl shadow-lg">
                  <role.Icon size={64} className="text-blue-400" strokeWidth={1.5} />
                </div>
                <p className="text-lg text-gray-400 leading-relaxed">
                  {role.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 mt-12">
          <Button
            size="lg"
            onClick={handleNext}
            disabled={!selectedRole || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 h-auto font-medium transition-colors"
          >
            {isLoading ? 'Saving...' : 'Next'}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading}
            className="text-gray-400 hover:text-white hover:bg-white/5 text-lg px-8 py-3 h-auto font-medium transition-colors"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
} 