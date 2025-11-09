'use client'

import { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export default function TestFirestore() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Čitanje iz Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const ref = doc(db, 'models', 'modelA')
        const snap = await getDoc(ref)
        
        if (snap.exists()) {
          setData(snap.data())
          console.log('✅ Podaci učitani:', snap.data())
        } else {
          console.log('⚠️ Nema dokumenta modelA!')
          setError('Dokument modelA ne postoji u Firestore')
        }
      } catch (err: any) {
        console.error('❌ Greška pri učitavanju:', err)
        setError(`Greška: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // Pisanje u Firestore
  const updateModel = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const ref = doc(db, 'models', 'modelA')
      const newPosition = [Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5]
      const newRotation = [0, Math.random() * Math.PI * 2, 0]
      
      await setDoc(ref, {
        position: newPosition,
        rotation: newRotation,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      
      console.log('✅ Model ažuriran u Firestore!')
      
      // Ponovno učitaj podatke
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setData(snap.data())
      }
      
      alert('✅ Model ažuriran u Firestore!')
    } catch (err: any) {
      console.error('❌ Greška pri spremanju:', err)
      setError(`Greška pri spremanju: ${err.message}`)
      alert(`❌ Greška: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Kreiranje dokumenta ako ne postoji
  const createModel = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const ref = doc(db, 'models', 'modelA')
      await setDoc(ref, {
        position: [-2, 0, 0],
        rotation: [0, 0, 0],
        updatedAt: serverTimestamp(),
      })
      
      console.log('✅ Dokument modelA kreiran!')
      
      // Ponovno učitaj podatke
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setData(snap.data())
      }
      
      alert('✅ Dokument modelA kreiran!')
    } catch (err: any) {
      console.error('❌ Greška pri kreiranju:', err)
      setError(`Greška pri kreiranju: ${err.message}`)
      alert(`❌ Greška: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Firestore Konekcije</h1>
        
        {/* Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status Konekcije</h2>
          
          {loading && (
            <div className="text-blue-600">⏳ Učitavanje podataka...</div>
          )}
          
          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded mb-4">
              <strong>❌ Greška:</strong> {error}
            </div>
          )}
          
          {!loading && !error && data && (
            <div className="text-green-600 bg-green-50 p-4 rounded mb-4">
              <strong>✅ Konekcija uspješna!</strong> Podaci su učitani iz Firestore.
            </div>
          )}
          
          {!loading && !error && !data && (
            <div className="text-yellow-600 bg-yellow-50 p-4 rounded mb-4">
              <strong>⚠️ Dokument ne postoji.</strong> Klikni "Kreiraj modelA" da kreiraš dokument.
            </div>
          )}
        </div>

        {/* Kontrole */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Kontrole</h2>
          <div className="flex gap-4">
            <button
              onClick={createModel}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Spremanje...' : 'Kreiraj modelA'}
            </button>
            <button
              onClick={updateModel}
              disabled={saving || !data}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Ažuriranje...' : 'Update modelA (random pozicija)'}
            </button>
          </div>
        </div>

        {/* Podaci */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Trenutni Podaci iz Firestore</h2>
          
          {loading ? (
            <div className="text-gray-500">Učitavanje...</div>
          ) : data ? (
            <div>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
              
              <div className="mt-4 space-y-2">
                <div>
                  <strong>Position:</strong> [
                  {Array.isArray(data.position) 
                    ? data.position.map((p: number, i: number) => (
                        <span key={i}>
                          {p.toFixed(2)}
                          {i < data.position.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    : 'N/A'
                  }]
                </div>
                <div>
                  <strong>Rotation:</strong> [
                  {Array.isArray(data.rotation) 
                    ? data.rotation.map((r: number, i: number) => (
                        <span key={i}>
                          {r.toFixed(2)}
                          {i < data.rotation.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    : 'N/A'
                  }]
                </div>
                {data.updatedAt && (
                  <div>
                    <strong>Updated At:</strong>{' '}
                    {data.updatedAt.toDate ? data.updatedAt.toDate().toLocaleString() : 'N/A'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              Nema podataka. Klikni "Kreiraj modelA" da kreiraš dokument.
            </div>
          )}
        </div>

        {/* Upute */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold mb-2">📝 Upute za testiranje:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Provjeri da li se podaci učitavaju iz Firestore (gore prikazani JSON)</li>
            <li>Klikni "Update modelA" da promijeniš poziciju</li>
            <li>Provjeri u Firebase Console → Firestore → Data da li se podaci ažuriraju</li>
            <li>Osvježi stranicu - podaci bi trebali ostati spremljeni</li>
          </ol>
        </div>

        {/* Link natrag */}
        <div className="mt-6">
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Natrag na glavnu stranicu
          </a>
        </div>
      </div>
    </div>
  )
}

