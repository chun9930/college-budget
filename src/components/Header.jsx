import { NavLink, Link } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: '홈' },
  { to: '/budget-settings', label: '예산' },
  { to: '/expense-records', label: '기록' },
  { to: '/statistics', label: '분석' },
];

export default function Header() {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        <span className="brand-mark" aria-hidden="true">
          <img src="/logo.svg" alt="" />
        </span>
        <span className="brand-copy">
          <strong>College Budget</strong>
          <span>대학생 지출 관리</span>
        </span>
      </Link>

      <nav className="desktop-nav" aria-label="주요 페이지">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
