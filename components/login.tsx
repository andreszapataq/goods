'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Box, Key, Sparkles } from "lucide-react"
import { supabase } from '@/utils/supabase'

const features = [
  { icon: <Sparkles className="h-4 w-4" />, text: "Track your belongings" },
  { icon: <Box className="h-4 w-4" />, text: "Organize by categories" },
  { icon: <Key className="h-4 w-4" />, text: "Secure and private" },
]

export default function Component() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleForm = () => setIsLogin(!isLogin)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        
        window.location.href = '/'
      } else {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        
        if (signUpError) throw signUpError

        if (authData?.user) {
          try {
            const { error: rpcError } = await supabase.rpc('create_user_profile', {
              user_id: authData.user.id,
              user_email: email,
              user_name: name
            })
          
            if (rpcError) {
              console.error('Error específico:', rpcError)
              throw rpcError
            }
          
            setError('Por favor revisa tu email para verificar tu cuenta.')
          } catch (rpcErr) {
            console.error('Error creating user profile:', rpcErr)
            // Mostrar un mensaje más específico basado en el error
            setError(rpcErr instanceof Error ? 
              `Error creando el perfil: ${rpcErr.message}` : 
              'Error creando el perfil de usuario')
          }
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-heading">{isLogin ? "Sign in" : "Sign up"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your email and password to access your inventory"
              : "Create an account to start tracking your inventory"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="m@example.com" required type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" required type="password" />
            </div>
            {isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember">Remember me</Label>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "Cargando..." : (isLogin ? "Sign in" : "Sign up")}
            </Button>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <div className="text-sm text-muted-foreground text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button className="underline text-primary hover:text-primary/90" onClick={toggleForm}>
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-heading text-lg mb-2 text-center">Why use our app?</h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    {feature.icon}
                    <span className="text-sm text-muted-foreground">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}