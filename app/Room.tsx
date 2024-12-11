'use client'

import { useCallback, useEffect, useState } from 'react'
import { useNakama } from './nakama'
import { Board } from './Board'
import type { Room as RoomType } from './types'

type State =
	| {
			status: 'found'
			room: RoomType
	  }
	| {
			status: 'initial' | 'loading' | 'not_found'
	  }

// using zod is better, but we’re keeping the exercise minimal
const isValidRoom = (room: unknown): room is RoomType => {
	if (typeof room !== 'object' || room === null) return false
	if (
		!('goal_x' in room) ||
		!('goal_y' in room) ||
		!('player_x' in room) ||
		!('player_y' in room)
	) {
		return false
	}

	return (
		room.goal_x !== undefined &&
		room.goal_y !== undefined &&
		room.player_x !== undefined &&
		room.player_y !== undefined
	)
}

export const Room = () => {
	const { rpc, account } = useNakama()
	// using react-query is better, but we’re keeping the exercise minimal
	const [state, setState] = useState<State>({ status: 'initial' })

	const newGame = useCallback(async () => {
		try {
			await rpc('tx/game/create-room', { Owner: account.user?.username })
		} catch (error) {
			console.log(error)
		}
	}, [rpc, account.user?.username])

	const getRoomState = useCallback(async () => {
		try {
			if (state.status === 'initial') setState({ status: 'loading' })

			const res = await rpc('query/game/room-state', { Owner: account.user?.username })

			if (res.payload && isValidRoom(res.payload)) {
				setState({ status: 'found', room: res.payload })
			}
		} catch (error) {
			console.log(error)
			setState({ status: 'not_found' })
		}
	}, [state.status, rpc, account.user?.username])

	useEffect(() => {
		// poll for room state every 500ms
		const interval = setInterval(getRoomState, 500)
		return () => clearInterval(interval)
	}, [getRoomState])

	if (state.status === 'initial') return null
	if (state.status === 'loading') return 'Loading room state…'
	if (state.status === 'not_found') {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<button
					type="button"
					onClick={newGame}
					className="rounded-md bg-black px-8 py-4 text-2xl font-bold text-white"
				>
					New Game
				</button>
			</div>
		)
	}

	if (state.status !== 'found') return null

	return <Board room={state.room} />
}
