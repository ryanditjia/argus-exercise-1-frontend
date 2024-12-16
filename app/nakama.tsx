'use client'

import { createContext, use, useEffect, useState } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { Client, RpcResponse } from '@heroiclabs/nakama-js'

type RPC = (id: string, input: object) => Promise<RpcResponse> // same signature as client.rpc, but the `session` is already provided

type Account = Awaited<ReturnType<typeof Client.prototype.getAccount>> // Nakama SDK doesn’t export ApiAccount type, so we have to use the raw type

const NakamaContext = createContext<{
	rpc: RPC
	account: Account
} | null>(null)

type State =
	| {
			status: 'success'
			rpc: RPC
			account: Account
	  }
	| {
			status: 'idle' | 'loading' | 'error'
	  }

export const NakamaProvider = ({ children }: { children: React.ReactNode }) => {
	const [state, setState] = useState<State>({ status: 'idle' })

	useEffect(() => {
		const initialize = async () => {
			console.group('Initialize Nakama')

			try {
				setState({ status: 'loading' })

				const client = new Client('defaultkey', '127.0.0.1', '7350')

				// use FingerprintJS for unique device ID
				const fp = await FingerprintJS.load()
				const { visitorId } = await fp.get()
				console.log('visitorId: ', visitorId)

				const session = await client.authenticateDevice(visitorId)
				const account = await client.getAccount(session)
				console.log('account: ', account)

				// TODO: skip if already accepted (look into Nakama's Storage)
				await client
					.rpc(session, 'nakama/claim-persona', { personaTag: account.user?.username })
					.catch(() => {})

				const rpc = async (id: string, input: object): Promise<RpcResponse> => {
					if (!session) throw new Error('Nakama session not found')
					return await client.rpc(session, id, input)
				}

				setState({ status: 'success', rpc, account })
			} catch (error) {
				console.error(error)
				setState({ status: 'error' })
			}

			console.groupEnd()
		}

		initialize()
	}, [])

	if (state.status === 'idle') return null
	if (state.status === 'loading') return 'Initializing Nakama…'
	if (state.status === 'error') return 'Failed to initialize Nakama'
	if (state.status !== 'success') return null

	return (
		<NakamaContext.Provider value={{ rpc: state.rpc, account: state.account }}>
			{children}
		</NakamaContext.Provider>
	)
}

// safe to call useNakama anywhere below NakamaProvider, the `rpc` and `account` will be available
export const useNakama = () => {
	const nakama = use(NakamaContext)
	if (!nakama) throw new Error('Nakama context not found')
	return nakama
}
