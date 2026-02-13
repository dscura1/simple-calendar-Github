import { useStore } from '../../store';

export function ContextSelector() {
  const { contexts, activeContextId, activeSubCompanyId, setActiveContext } = useStore();

  const topLevelContexts = contexts.filter((c) => !c.parentId);
  const workContext = topLevelContexts.find((c) => c.type === 'work');
  const subCompanies = workContext
    ? contexts.filter((c) => c.parentId === workContext.id)
    : [];

  return (
    <div style={{
      padding: '12px',
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
    }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: subCompanies.length > 0 && activeContextId === workContext?.id ? '8px' : 0 }}>
        <button
          onClick={() => setActiveContext(null)}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            background: activeContextId === null ? '#6366f1' : 'white',
            color: activeContextId === null ? 'white' : '#374151',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          All
        </button>
        {topLevelContexts.map((ctx) => (
          <button
            key={ctx.id}
            onClick={() => setActiveContext(ctx.id!)}
            style={{
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              background: activeContextId === ctx.id ? (ctx.color || '#3b82f6') : 'white',
              color: activeContextId === ctx.id ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: activeContextId === ctx.id ? 600 : 400,
            }}
          >
            {ctx.name}
          </button>
        ))}
      </div>

      {/* Sub-companies (when Work is active) */}
      {workContext && activeContextId === workContext.id && subCompanies.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', paddingLeft: '12px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', alignSelf: 'center' }}>→</span>
          {subCompanies.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveContext(workContext.id!, sub.id!)}
              style={{
                padding: '4px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                background: activeSubCompanyId === sub.id ? '#3b82f6' : '#f9fafb',
                color: activeSubCompanyId === sub.id ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
