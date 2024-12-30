'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session) {
          // Si la sesión existe, redirigir al usuario a la página principal
          router.push('/')
        }
      } catch (error) {
        console.error('Error en callback de autenticación:', error)
        router.push('/login?error=Error+al+verificar+el+correo')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h1 className="text-2xl font-semibold">Verificando tu correo...</h1>
        <p className="text-muted-foreground">
          Serás redirigido automáticamente en unos momentos.
        </p>
      </div>
    </div>
  )
} 