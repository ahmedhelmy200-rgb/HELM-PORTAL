import React, { lazy } from 'react';

const Cases = lazy(() => import('./pages/Cases'));
const Clients = lazy(() => import('./pages/Clients'));
const Client360 = lazy(() => import('./pages/Client360'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Dashboard = lazy(() => import('./pages/DashboardOptimized'));
const Discover = lazy(() => import('./pages/Discover'));
const Documents = lazy(() => import('./pages/Documents'));
const Events = lazy(() => import('./pages/Events'));
const FounderDetail = lazy(() => import('./pages/FounderDetail'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Collections = lazy(() => import('./pages/Collections'));
const LegalTemplates = lazy(() => import('./pages/LegalTemplates'));
const LegalWebsites = lazy(() => import('./pages/LegalWebsites'));
const Messages = lazy(() => import('./pages/Messages'));
const Network = lazy(() => import('./pages/Network'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Settings = lazy(() => import('./pages/Settings'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Income = lazy(() => import('./pages/Income'));
const BankImport = lazy(() => import('./pages/BankImport'));
const Reports = lazy(() => import('./pages/Reports'));
const Communications = lazy(() => import('./pages/Communications'));
const Archive = lazy(() => import('./pages/Archive'));
const HelmSmart = lazy(() => import('./pages/HelmSmartEnhanced'));
const UserActivity = lazy(() => import('./pages/UserActivity'));
const SocialPublisher = lazy(() => import('./pages/SocialPublisher'));
const __Layout = lazy(() => import('./Layout.jsx'));

export const PAGES = {
  Cases,
  Clients,
  Client360,
  Contacts,
  Dashboard,
  Discover,
  Documents,
  Events,
  FounderDetail,
  Invoices,
  Collections,
  LegalTemplates,
  LegalWebsites,
  Messages,
  Network,
  Notifications,
  Profile,
  Sessions,
  Settings,
  Tasks,
  Expenses,
  Income,
  BankImport,
  Reports,
  Communications,
  Archive,
  HelmSmart,
  UserActivity,
  SocialPublisher,
};

export const pagesConfig = {
  mainPage: 'Dashboard',
  Pages: PAGES,
  Layout: __Layout,
};
