import { Outlet } from "react-router-dom"
import { Header } from "./Header"

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 lg:px-8 lg:py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
