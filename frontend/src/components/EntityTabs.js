function EntityTabs({ tabOrder, entityConfig, activeTab, onChange }) {
  return (
    <div className="tabs" role="tablist" aria-label="Entidades">
      {tabOrder.map((tabKey) => {
        const tab = entityConfig[tabKey];
        const isActive = tabKey === activeTab;

        return (
          <button
            key={tabKey}
            type="button"
            className={`tab-button ${isActive ? "active" : ""}`}
            onClick={() => onChange(tabKey)}
          >
            {tab.title}
          </button>
        );
      })}
    </div>
  );
}

export default EntityTabs;
