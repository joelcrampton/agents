import { FormEvent, useEffect, useState } from 'react';
import { fetchProfile, saveProfile } from '../api';

// Must stay in sync with PROFILE_FIELDS in src/services/profile.ts.
const FIELDS = [
  { key: 'shoe', label: 'Shoe size', hint: 'US' },
  { key: 'waist', label: 'Waist', hint: 'in' },
  { key: 'shirt', label: 'Shirt size', hint: null },
] as const;

type Status = 'loading' | 'idle' | 'saving' | 'saved';

// Editor for the sizes the agent folds into its searches.
export default function ProfilePanel() {
  const [values, setValues] = useState<Record<string, string>>({ shoe: '', waist: '', shirt: '' });
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((entries) => {
        setValues((prev) => {
          const next = { ...prev };
          for (const e of entries) if (e.key in next) next[e.key] = e.value;
          return next;
        });
        setStatus('idle');
      })
      .catch((e: Error) => {
        setError(e.message);
        setStatus('idle');
      });
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setStatus('saving');
    setError(null);
    try {
      await saveProfile(FIELDS.map((f) => ({ key: f.key, value: values[f.key].trim() })));
      setStatus('saved');
    } catch (e) {
      setError((e as Error).message);
      setStatus('idle');
    }
  }

  return (
    <details className="profile">
      <summary>Your sizes</summary>
      <form className="profile-form" onSubmit={onSave}>
        {FIELDS.map((f) => (
          <label key={f.key}>
            {f.label}
            {f.hint && <span className="unit"> ({f.hint})</span>}
            <input
              type="text"
              value={values[f.key]}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }));
                setStatus((s) => (s === 'saved' ? 'idle' : s));
              }}
              placeholder="—"
            />
          </label>
        ))}
        <button type="submit" disabled={status === 'loading' || status === 'saving'}>
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save'}
        </button>
      </form>
      <p className="hint">Searches are tailored to these sizes. Leave a field blank to clear it.</p>
      {error && <p className="error">{error}</p>}
    </details>
  );
}
