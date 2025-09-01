import { Metadata } from 'next'
import { ProfileClient } from './ProfileClient'

export const metadata: Metadata = {
  title: 'Profile - BroJam',
  description: 'Manage your profile and account settings',
}

export default function ProfilePage() {
  return <ProfileClient />
}