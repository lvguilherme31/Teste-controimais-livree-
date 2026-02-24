import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import EsqueceuSenha from './pages/EsqueceuSenha'
import AcessoFuncionario from './pages/AcessoFuncionario'
import Dashboard from './pages/Dashboard'
import Financeiro from './pages/Financeiro'
import PagamentoFuncionarios from './pages/PagamentoFuncionarios'
import Colaboradores from './pages/Colaboradores'
import ColaboradorDetails from './pages/ColaboradorDetails'
import Obras from './pages/Obras'
import ObraDetails from './pages/ObraDetails'
import Veiculos from './pages/Veiculos'
import VeiculoDetails from './pages/VeiculoDetails'
import NotasFiscais from './pages/NotasFiscais'
import Orcamentos from './pages/Orcamentos'
import Configuracoes from './pages/Configuracoes'
import Alojamentos from './pages/Alojamentos'
import Prestadores from './pages/Prestadores'
import AlojamentoDetails from './pages/AlojamentoDetails'
import Ferramentas from './pages/Ferramentas'
import AluguelEquipamentos from './pages/AluguelEquipamentos'
import PrimeiroAcesso from './pages/PrimeiroAcesso'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import { AppProvider } from './stores/useAppStore'
import { AuthProvider } from './context'
import { ProtectedRoute } from './components/ProtectedRoute'

const App = () => (
  <AuthProvider>
    <AppProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/acesso-funcionario" element={<AcessoFuncionario />} />
            <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />


            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/financeiro" element={<ProtectedRoute requiredPermission="contas_pagar"><Financeiro /></ProtectedRoute>} />
              <Route path="/financeiro/pagamentos" element={<ProtectedRoute requiredPermission="pagamento_colaboradores"><PagamentoFuncionarios /></ProtectedRoute>} />
              <Route path="/colaboradores" element={<ProtectedRoute requiredPermission="colaboradores"><Colaboradores /></ProtectedRoute>} />
              <Route path="/colaboradores/:id" element={<ProtectedRoute requiredPermission="colaboradores"><ColaboradorDetails /></ProtectedRoute>} />
              <Route path="/obras" element={<ProtectedRoute requiredPermission="obras"><Obras /></ProtectedRoute>} />
              <Route path="/obras/:id" element={<ProtectedRoute requiredPermission="obras"><ObraDetails /></ProtectedRoute>} />
              <Route path="/alojamentos" element={<ProtectedRoute requiredPermission="alojamento"><Alojamentos /></ProtectedRoute>} />
              <Route path="/alojamentos/:id" element={<ProtectedRoute requiredPermission="alojamento"><AlojamentoDetails /></ProtectedRoute>} />
              <Route path="/prestadores" element={<ProtectedRoute requiredPermission="fichario_funcoes"><Prestadores /></ProtectedRoute>} />
              <Route path="/veiculos" element={<ProtectedRoute requiredPermission="veiculos"><Veiculos /></ProtectedRoute>} />
              <Route path="/veiculos/:id" element={<ProtectedRoute requiredPermission="veiculos"><VeiculoDetails /></ProtectedRoute>} />
              <Route path="/ferramentas" element={<ProtectedRoute requiredPermission="ferramentas"><Ferramentas /></ProtectedRoute>} />
              <Route path="/alugueis" element={<ProtectedRoute requiredPermission="aluguel_equipamentos"><AluguelEquipamentos /></ProtectedRoute>} />
              <Route path="/notas-fiscais" element={<ProtectedRoute requiredPermission="notas_fiscais"><NotasFiscais /></ProtectedRoute>} />
              <Route path="/orcamentos" element={<ProtectedRoute requiredPermission="orcamentos"><Orcamentos /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute requiredPermission="configuracoes"><Configuracoes /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
