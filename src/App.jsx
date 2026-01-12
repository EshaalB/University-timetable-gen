import MainLayout from './components/MainLayout'
import { TimetableProvider } from './context/TimetableContext'
import './styles/index.css'

function App() {
  return (
    <TimetableProvider>
      <MainLayout />
    </TimetableProvider>
  )
}

export default App
