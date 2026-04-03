import { useContext } from 'react'
import { CompanyContext } from '../contexts/CompanyContext'

export function useCompany() {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}

export default useCompany
