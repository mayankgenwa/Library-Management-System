import { Trash2, Users, Calendar, ArrowRight } from 'lucide-react';
import { User } from '../types.js';

interface MemberManagerProps {
  members: User[];
  onDeleteMember: (id: string) => void;
  onSelectMember: (id: string) => void;
  selectedMemberId?: string;
}

export default function MemberManager({
  members,
  onDeleteMember,
  onSelectMember,
  selectedMemberId,
}: MemberManagerProps) {
  return (
    <div id="member-manager-container" className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="text-[#1b3d2f]" size={18} />
        <h3 className="font-serif font-medium text-stone-900 text-sm">
          Registered Library Members ({members.length})
        </h3>
      </div>

      {members.length === 0 ? (
        <div className="py-8 border border-dashed border-stone-200 rounded-lg text-center text-xs text-stone-400 font-serif italic">
          No members registered in the system yet.
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-200 rounded-lg">
          <table className="w-full text-left border-collapse text-stone-800">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 font-mono text-[10px] text-stone-500 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">Member Name</th>
                <th className="py-2.5 px-4 font-semibold">Email</th>
                <th className="py-2.5 px-4 font-semibold hidden md:table-cell">Joined Date</th>
                <th className="py-2.5 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-xs">
              {members.map((member) => {
                const isSelected = selectedMemberId === member.id;
                return (
                  <tr
                    id={`member-row-${member.id}`}
                    key={member.id}
                    onClick={() => onSelectMember(member.id)}
                    className={`group transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-stone-100 font-medium' 
                        : 'hover:bg-stone-50 bg-white'
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-stone-950">
                      <div className="flex items-center gap-1.5">
                        {member.name}
                        {isSelected && (
                          <span className="text-[9px] bg-stone-800 text-stone-100 px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
                            Active Test Target
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono">{member.email}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-stone-400 font-mono">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Calendar size={11} />
                        {new Date(member.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`delete-member-btn-${member.id}`}
                        onClick={() => onDeleteMember(member.id)}
                        className="p-1 hover:bg-stone-200 rounded text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Member Account"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
