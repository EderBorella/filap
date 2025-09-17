import React from 'react';
import { useTranslation } from 'react-i18next';
import './TabNavigation.scss';

export type TabKey = 'questions' | 'speakers';

interface Tab {
  key: TabKey;
  label: string;
  count?: number;
}

export interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  questionCount?: number;
  handRaiseCount?: number;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  questionCount = 0,
  handRaiseCount = 0
}) => {
  const { t } = useTranslation();

  const tabs: Tab[] = [
    {
      key: 'questions',
      label: t('handRaise.questions'),
      count: questionCount
    },
    {
      key: 'speakers',
      label: t('handRaise.speakers'),
      count: handRaiseCount
    }
  ];

  return (
    <div className="tab-navigation">
      <div className="tab-navigation__container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-navigation__tab ${
              activeTab === tab.key ? 'tab-navigation__tab--active' : ''
            }`}
            onClick={() => onTabChange(tab.key)}
            aria-pressed={activeTab === tab.key}
          >
            <span className="tab-navigation__tab-label">{tab.label}</span>
            {(tab.count !== undefined && tab.count > 0) && (
              <span className="tab-navigation__tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;