import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Usuario, ListaActividades } from "../config/authApi"

interface AuthContextType {
  user: Usuario | null
  userActivities: ListaActividades[]
  isLoggedIn: boolean
  isLoading: boolean
  login: (user: Usuario, activities: ListaActividades[]) => Promise<void>
  logout: () => Promise<void>
  hasActivity: (activityName: string) => boolean
  updateUser: (user: Usuario) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null)
  const [userActivities, setUserActivities] = useState<ListaActividades[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isLoggedIn = user !== null;

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedUser, storedActivities] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("userActivities"),
        ])

        if (storedUser && storedActivities) {
          setUser(JSON.parse(storedUser))
          setUserActivities(JSON.parse(storedActivities))
          console.log("✅ Sesión recuperada")
        }
      } catch (error) {
        console.error("❌ Error recuperando sesión:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredAuth()
  }, [])

  const login = useCallback(async (newUser: Usuario, activities: ListaActividades[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem("user", JSON.stringify(newUser)),
        AsyncStorage.setItem("userActivities", JSON.stringify(activities)),
      ])
      
      setUser(newUser)
      setUserActivities(activities)
    } catch (error) {
      console.error("❌ Error en Login:", error)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove(["user", "userActivities"])
      setUser(null)
      setUserActivities([])
    } catch (error) {
      console.error("❌ Error en Logout:", error)
    }
  }, [])

  const updateUser = useCallback(async (updatedUser: Usuario) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
    } catch (error) {
      console.error("❌ Error actualizando usuario:", error)
      throw error
    }
  }, [])

  const hasActivity = useCallback((activityName: string): boolean => {
    return userActivities.some((activity) => activity.nombreActividad === activityName)
  }, [userActivities])

  const authValue = useMemo(() => ({
    user,
    userActivities,
    isLoggedIn,
    isLoading,
    login,
    logout,
    hasActivity,
    updateUser,
  }), [user, userActivities, isLoggedIn, isLoading, login, logout, hasActivity, updateUser])

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}