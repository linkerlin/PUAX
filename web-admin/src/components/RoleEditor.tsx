import { useState } from 'react'

interface Role {
  id: string
  name: string
  description: string
  category: string
}

const sampleRoles: Role[] = [
  { id: 'military-warrior', name: '战士', description: '核心开发和攻坚克难', category: '军事' },
  { id: 'shaman-musk', name: '马斯克', description: '第一性原理思维', category: '萨满' },
]

export default function RoleEditor() {
  const [roles] = useState<Role[]>(sampleRoles)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  return (
    <div className="role-editor">
      <h2>角色编辑器</h2>
      
      <div className="editor-layout">
        <div className="role-list">
          {roles.map(role => (
            <div 
              key={role.id}
              className={`role-item ${selectedRole?.id === role.id ? 'selected' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <strong>{role.name}</strong>
              <span>{role.category}</span>
            </div>
          ))}
        </div>

        <div className="role-detail">
          {selectedRole ? (
            <>
              <h3>{selectedRole.name}</h3>
              <p>{selectedRole.description}</p>
            </>
          ) : (
            <p>请选择一个角色</p>
          )}
        </div>
      </div>
    </div>
  )
}
