import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>
            {!submitted
              ? 'Digite seu email para receber o link de redefinição'
              : 'Verifique sua caixa de entrada'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Enviar Link
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-center text-muted-foreground">
                Enviamos um email para <strong>{email}</strong> com instruções
                para recuperar sua senha.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/login">
              <ArrowLeft className="h-4 w-4" /> Voltar para Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
