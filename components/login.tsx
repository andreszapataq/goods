'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Box, Eye, EyeOff, Key, Sparkles } from "lucide-react"
import { supabase } from '@/utils/supabase'
import Image from 'next/image'

const features = [
  { icon: <Sparkles className="h-4 w-4" />, text: "Rastrea tus pertenencias" },
  { icon: <Box className="h-4 w-4" />, text: "Organiza por cajas" },
  { icon: <Key className="h-4 w-4" />, text: "Seguro y privado" },
]

export default function Component() {
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
        <div className="flex justify-center pt-8">
          <Image
            src="/logo.svg"
            alt="Goods Logo"
            width={120}
            height={36}
            priority
            className="h-auto"
          />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-heading">{isLogin ? "Iniciar sesión" : "Registrarse"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Ingresa tu correo y contraseña para acceder a tu inventario"
              : "Crea una cuenta para comenzar a rastrear tu inventario"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" placeholder="Juan Pérez" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" placeholder="m@ejemplo.com" required type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  required 
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {isLogin && (
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember">Recordarme</Label>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" disabled={isLoading}>
              {isLoading ? "Cargando..." : (isLogin ? "Iniciar sesión" : "Registrarse")}
            </Button>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <div className="text-sm text-muted-foreground text-center">
              {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
              <button className="underline text-primary hover:text-primary/90" onClick={toggleForm}>
                {isLogin ? "Regístrate" : "Inicia sesión"}
              </button>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-heading text-lg mb-2 text-center">¿Por qué usar nuestra aplicación?</h3>
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