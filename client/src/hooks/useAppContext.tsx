import { createContext, useContext, useReducer, ReactNode } from "react";
import { AppState, User } from "../types";

interface AppContextType extends AppState {
  setCurrentUser: (user: User) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  setConnectionStatus: (isConnected: boolean, error?: string) => void;
  clearUsers: () => void;
}

type AppAction =
  | { type: "SET_CURRENT_USER"; payload: User }
  | { type: "ADD_USER"; payload: User }
  | { type: "REMOVE_USER"; payload: string }
  | { type: "UPDATE_USER"; payload: { userId: string; updates: Partial<User> } }
  | {
      type: "SET_CONNECTION_STATUS";
      payload: { isConnected: boolean; error?: string };
    }
  | { type: "CLEAR_USERS" };

const initialState: AppState = {
  currentUser: null,
  users: new Map(),
  isConnected: false,
  connectionError: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CURRENT_USER":
      return {
        ...state,
        currentUser: action.payload,
      };

    case "ADD_USER": {
      const newUsers = new Map(state.users);
      newUsers.set(action.payload.id, action.payload);
      return {
        ...state,
        users: newUsers,
      };
    }

    case "REMOVE_USER": {
      const updatedUsers = new Map(state.users);
      updatedUsers.delete(action.payload);
      return {
        ...state,
        users: updatedUsers,
      };
    }

    case "UPDATE_USER": {
      const usersToUpdate = new Map(state.users);
      const existingUser = usersToUpdate.get(action.payload.userId);
      if (existingUser) {
        usersToUpdate.set(action.payload.userId, {
          ...existingUser,
          ...action.payload.updates,
        });
      }
      return {
        ...state,
        users: usersToUpdate,
      };
    }

    case "SET_CONNECTION_STATUS":
      return {
        ...state,
        isConnected: action.payload.isConnected,
        connectionError: action.payload.error || null,
      };

    case "CLEAR_USERS":
      return {
        ...state,
        users: new Map(),
      };

    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setCurrentUser = (user: User) => {
    dispatch({ type: "SET_CURRENT_USER", payload: user });
  };

  const addUser = (user: User) => {
    dispatch({ type: "ADD_USER", payload: user });
  };

  const removeUser = (userId: string) => {
    dispatch({ type: "REMOVE_USER", payload: userId });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    dispatch({ type: "UPDATE_USER", payload: { userId, updates } });
  };

  const setConnectionStatus = (isConnected: boolean, error?: string) => {
    dispatch({
      type: "SET_CONNECTION_STATUS",
      payload: { isConnected, error },
    });
  };

  const clearUsers = () => {
    dispatch({ type: "CLEAR_USERS" });
  };

  const contextValue: AppContextType = {
    ...state,
    setCurrentUser,
    addUser,
    removeUser,
    updateUser,
    setConnectionStatus,
    clearUsers,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
