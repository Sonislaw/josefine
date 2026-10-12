import { chooseComputerTurn } from './engine'
import type { GameState } from './engine'
// Inline worker is also embedded in the downloadable HTML (no network dependency).
self.onmessage = (event: MessageEvent<{ state: GameState; depth: number }>) => {
  self.postMessage(chooseComputerTurn(event.data.state, event.data.depth))
}
