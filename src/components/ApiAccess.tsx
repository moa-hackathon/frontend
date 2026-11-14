import { useState } from 'react'
import { getInviteCode, setInviteCode } from '../services/api'
export function ApiAccess({ onSave }: { onSave: () => void }) {
  const [value, setValue] = useState(getInviteCode)
  return <form className="api-access" onSubmit={(event) => { event.preventDefault(); setInviteCode(value); onSave() }}>
    <label htmlFor="invite-code">동아리 초대 코드</label>
    <input id="invite-code" type="password" autoComplete="off" value={value} onChange={(event) => setValue(event.target.value)} required />
    <button className="primary-button" type="submit">연결</button>
  </form>
}
