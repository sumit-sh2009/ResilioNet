import { Component, type ReactNode } from "react"
import { BrowserRouter, Link, Route, Routes } from "react-router-dom"
import { Landing } from "./pages/landing"
import Operations from "./pages/operations"

class BoardBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4">
          <h1 className="font-serif text-3xl uppercase">The board stopped</h1>
          <p className="text-sm leading-6 text-muted-foreground">Reload the page. The landing overview is still available.</p>
          <Link to="/" className="font-mono text-sm uppercase tracking-[0.12em] text-primary">
            Back to ResilioNet
          </Link>
        </main>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/operations"
          element={
            <BoardBoundary>
              <Operations />
            </BoardBoundary>
          }
        />
        <Route
          path="*"
          element={
            <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 px-4">
              <h1 className="font-serif text-3xl uppercase">This page is not on the board</h1>
              <Link to="/" className="font-mono text-sm uppercase tracking-[0.12em] text-primary">
                Back to ResilioNet
              </Link>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
