import { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

export default function App(){
  const [user, setUser] = useState(()=>{
    const saved = localStorage.getItem('hookgen_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('hookgen_token');
    localStorage.removeItem('hookgen_user');
    setUser(null);
  }

  if(!user){
    return <Auth onAuthSuccess={setUser} />
  }

  return <Dashboard user={user} onLogout={handleLogout}/>
}