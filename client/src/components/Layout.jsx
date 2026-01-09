import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { ArrowLeftOnRectangleIcon, Cog6ToothIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from './ui/button.jsx';
import { cn } from '../lib/utils.js';

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('nav.title')}
            </div>
            <div className="flex items-center gap-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <HomeIcon className="h-5 w-5" />
                <span>{t('nav.dashboard')}</span>
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) => cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Cog6ToothIcon className="h-5 w-5" />
                <span>{t('nav.adminPanel')}</span>
              </NavLink>
              <LanguageSwitcher />
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default Layout;
