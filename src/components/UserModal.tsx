import React, { useState } from 'react';
import { X, UserPlus, Check, Trash2, User, Trophy, BarChart3 } from 'lucide-react';
import type { UserProfile } from '../types';
import { getUsers, createUser, deleteUser, setActiveUserId, getUserStats } from '../utils/storage';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: UserProfile;
  onUserChanged: (newUser: UserProfile) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  onUserChanged,
}) => {
  const [users, setUsers] = useState<UserProfile[]>(getUsers());
  const [newUserName, setNewUserName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const refreshList = () => {
    const list = getUsers();
    setUsers(list);
  };

  const handleSelectUser = (user: UserProfile) => {
    setActiveUserId(user.id);
    onUserChanged(user);
    onClose();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      setErrorMsg('Пожалуйста, введите имя пользователя');
      return;
    }
    const created = createUser(newUserName);
    setNewUserName('');
    setIsCreating(false);
    setErrorMsg('');
    refreshList();
    onUserChanged(created);
    onClose();
  };

  const handleDelete = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (users.length <= 1) {
      alert('Нельзя удалить единственного пользователя');
      return;
    }
    if (confirm('Вы уверены, что хотите удалить этого пользователя и всю его историю?')) {
      deleteUser(userId);
      refreshList();
      const currentList = getUsers();
      if (activeUser.id === userId && currentList.length > 0) {
        onUserChanged(currentList[0]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-rose-500" />
            <h2 className="text-lg font-bold text-slate-100">Профиль пользователя</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-400">
            Результаты тестов и статистика ошибок сохраняются локально для каждого пользователя раздельно.
          </p>

          {/* User List */}
          <div className="space-y-2">
            {users.map((user) => {
              const isCurrent = user.id === activeUser.id;
              const stats = getUserStats(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-rose-500/10 border-rose-500/50 shadow-sm shadow-rose-900/10'
                      : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white ${
                        isCurrent
                          ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100 truncate">
                          {user.name}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Активен
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3 text-slate-400" />
                          Тестов: {stats.totalTests}
                        </span>
                        {stats.totalTests > 0 && (
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            Точность: {stats.overallAccuracy}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      users.length > 1 && (
                        <button
                          onClick={(e) => handleDelete(user.id, e)}
                          title="Удалить пользователя"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New User */}
          {isCreating ? (
            <form onSubmit={handleCreate} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Имя нового пользователя
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Например: Иван Иванов"
                autoFocus
                maxLength={40}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setErrorMsg('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                >
                  Создать
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-xs font-medium bg-slate-800/40 hover:bg-slate-800/80 transition-all"
            >
              <UserPlus className="w-4 h-4 text-rose-400" />
              Добавить нового пользователя
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
