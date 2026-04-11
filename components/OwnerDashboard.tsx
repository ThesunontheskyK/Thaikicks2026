
import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Users, DollarSign, Activity, Trash2, Edit, Plus, Calendar, Layers } from 'lucide-react';
import { Booking, Gym, Trainer, TrainerSchedule, User } from '../lib/types';
import { createGym, updateGym as updateGymDB, createTrainer, deleteTrainer, getTrainerSchedules, createTrainerSchedule, deleteTrainerSchedule, deleteGym } from '../services/dataService';

interface OwnerDashboardProps {
    user: User;
    gyms: Gym[];
    updateGym: (gym: Gym) => void;
    refreshGyms: () => void;
    bookings: Booking[];
}

const BlockTable: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = "" }) => (
    <div className={`border-2 border-brand-charcoal bg-white flex flex-col ${className}`}>
        <div className="p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center shrink-0">
            <h3 className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
                {icon}
                {title}
            </h3>
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-brand-charcoal"></div>
                <div className="w-2 h-2 border border-brand-charcoal"></div>
            </div>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
);

const Mono: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <span className={`font-mono text-xs tracking-widest uppercase ${className}`}>
        {children}
    </span>
);

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, gyms, updateGym, refreshGyms, bookings }) => {
    const [myGyms, setMyGyms] = useState<Gym[]>([]);
    const [selectedGymId, setSelectedGymId] = useState<string>('all');
    
    // Gym Edit State
    const [editingGym, setEditingGym] = useState<Partial<Gym> | null>(null);
    const [isGymFormOpen, setIsGymFormOpen] = useState(false);

    // Trainer Form State
    const [newTrainer, setNewTrainer] = useState<Partial<Trainer>>({ name: '', specialty: '', pricePerSession: 500, image: '' });
    const [managingScheduleFor, setManagingScheduleFor] = useState<Trainer | null>(null);
    const [trainerSchedules, setTrainerSchedules] = useState<TrainerSchedule[]>([]);
    const [newSchedule, setNewSchedule] = useState<{ day: string; start: string; end: string }>({ day: 'Monday', start: '09:00', end: '10:00' });

    // Booking Filter
    const [bookingDateFilter, setBookingDateFilter] = useState('');

    const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'bookings'>('overview');

    useEffect(() => {
        const found = gyms.filter(g => g.ownerId === user.id);
        setMyGyms(found);
    }, [gyms, user.id]);

    const activeGym = myGyms.find(g => g.id === selectedGymId) || null;

    const handleSaveGym = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGym) return;

        try {
            if (editingGym.id) {
                const payload = { ...editingGym, approvalStatus: 'pending' as const, isVerified: false };
                await updateGymDB(editingGym.id, payload);
                updateGym(payload as Gym);
            } else {
                await createGym({ ...editingGym, ownerId: user.id } as Gym);
                refreshGyms();
            }
            setIsGymFormOpen(false);
            setEditingGym(null);
            refreshGyms();
        } catch (err: any) {
            console.error(err);
            alert("Failed to save gym: " + (err.message || String(err)));
        }
    };

    const handleDeleteGym = async (id: string) => {
        if (!confirm("Are you sure you want to delete this facility? This cannot be undone.")) return;
        try {
            await deleteGym(id);
            if (selectedGymId === id) setSelectedGymId('all');
            refreshGyms();
        } catch (err: any) {
            console.error(err);
            alert("Failed to delete facility");
        }
    };

    // Calculate Stats
    const gymIdsToFilter = selectedGymId === 'all' ? myGyms.map(g => g.id) : [selectedGymId];
    
    const ownerBookings = bookings.filter(b => gymIdsToFilter.includes(b.gymId) && (b.status === 'confirmed' || b.status === 'completed'));
    const totalRevenue = ownerBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const filteredBookings = ownerBookings.filter(b => !bookingDateFilter || b.date === bookingDateFilter);
    const activeTrainersCount = selectedGymId === 'all' ? myGyms.reduce((sum, g) => sum + g.trainers.length, 0) : activeGym?.trainers?.length || 0;

    return (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-10 py-12 animate-reveal min-h-[80vh]">
            <div className="mb-12 border-b-2 border-brand-charcoal pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <Mono className="text-brand-blue">Gym Owner Console</Mono>
                    <h1 className="text-3xl md:text-4xl font-black uppercase text-brand-charcoal mt-2">
                        {selectedGymId === 'all' ? 'All Facilities Overview' : activeGym?.name}
                    </h1>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-charcoal text-white font-mono text-xs font-bold uppercase w-fit">
                        <Shield className="w-4 h-4" />
                        Owner Access
                    </div>
                </div>
            </div>

            <div className="mb-12 border-2 border-brand-charcoal bg-white shadow-[8px_8px_0px_0px_#1A1A1A]">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-brand-charcoal/10">
                    <div className="p-6 flex flex-col justify-center">
                        <Mono className="text-brand-blue mb-2">Total Revenue</Mono>
                        <div className="text-4xl font-black flex justify-between items-center">
                            ฿{totalRevenue.toLocaleString()}
                            <DollarSign className="w-8 h-8 text-gray-200" />
                        </div>
                    </div>
                    <div className="p-6 flex flex-col justify-center">
                        <Mono className="text-brand-blue mb-2">Total Bookings</Mono>
                        <div className="text-4xl font-black flex justify-between items-center">
                            {ownerBookings.length}
                            <Users className="w-8 h-8 text-gray-200" />
                        </div>
                    </div>
                    <div className="p-6 flex flex-col justify-center">
                        <Mono className="text-brand-blue mb-2">Active Trainers</Mono>
                        <div className="text-4xl font-black flex justify-between items-center">
                            {activeTrainersCount}
                            <Activity className="w-8 h-8 text-brand-blue" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="w-full lg:w-64 space-y-2 shrink-0">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'overview' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                        <Activity className="w-4 h-4" /> Dashboard
                    </button>
                    <button onClick={() => setActiveTab('facilities')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'facilities' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                        <Layers className="w-4 h-4" /> My Facilities
                    </button>
                    <button onClick={() => setActiveTab('bookings')} className={`w-full text-left px-4 py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-3 ${activeTab === 'bookings' ? 'bg-brand-charcoal text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                        <Calendar className="w-4 h-4" /> Ledger & Bookings
                    </button>
                </aside>

                <div className="flex-1 min-w-0 space-y-8">
                    {/* Facilities Tab Content */}
                    {activeTab === 'facilities' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <BlockTable title="Facility Inventory" icon={<Layers className="w-4 h-4" />}>
                                <div className="p-4 bg-gray-50 flex justify-between items-center border-b border-gray-200">
                                    <select className="border border-brand-charcoal p-2 text-xs font-mono bg-white" value={selectedGymId} onChange={e => setSelectedGymId(e.target.value)}>
                                        <option value="all">All Facilities</option>
                                        {myGyms.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <button onClick={() => { setEditingGym({ category: 'gym' }); setIsGymFormOpen(true); }} className="bg-brand-charcoal text-white p-2 font-black uppercase text-[10px] hover:bg-brand-blue">
                                        + Add New
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                    {myGyms.map(gym => (
                                        <div key={gym.id} className={`p-4 flex flex-col hover:bg-gray-50 cursor-pointer ${selectedGymId === gym.id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedGymId(gym.id)}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-sm uppercase">{gym.name}</div>
                                                {gym.approvalStatus === 'approved' ? (
                                                    <span className="bg-green-100 text-green-700 text-[8px] px-2 py-0.5 rounded border border-green-200 font-bold uppercase">Approved</span>
                                                ) : gym.approvalStatus === 'rejected' ? (
                                                    <span className="bg-red-100 text-red-700 text-[8px] px-2 py-0.5 rounded border border-red-200 font-bold uppercase">Rejected</span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 text-[8px] px-2 py-0.5 rounded border border-orange-200 font-bold uppercase animate-pulse">Pending</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono flex justify-between">
                                                <span>{gym.location} • {gym.category}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingGym(gym); setIsGymFormOpen(true); }} className="text-brand-blue hover:underline font-bold">Edit</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteGym(gym.id); }} className="text-brand-red hover:underline font-bold">Del</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </BlockTable>

                        </div>
                    )}

                    {/* Bookings & Overview Tab */}
                    {(activeTab === 'bookings' || activeTab === 'overview') && (
                        <BlockTable title="Booking Ledger" icon={<Activity className="w-4 h-4" />}>
                           <div className="p-4 bg-gray-50 border-b border-gray-100 flex gap-4">
                                <input
                                    type="date"
                                    className="border border-brand-charcoal p-2 text-xs font-mono bg-white"
                                    value={bookingDateFilter}
                                    onChange={e => setBookingDateFilter(e.target.value)}
                                />
                                {selectedGymId !== 'all' && (
                                   <div className="font-mono text-[10px] text-gray-500 flex items-center">
                                       Showing ledger for {activeGym?.name}
                                   </div>
                                )}
                            </div>
                            <div className="max-h-[500px] overflow-y-auto divide-y-2 divide-gray-100 bg-white">
                                {filteredBookings.length === 0 ? <div className="p-12 text-center text-xs text-gray-400 font-mono">No bookings found for selected criteria</div> :
                                    filteredBookings.map(b => (
                                        <div key={b.id} className="p-4 hover:bg-brand-bone transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-black text-sm uppercase text-brand-charcoal block">{b.userName}</span>
                                                    <span className="font-mono text-[10px] text-brand-blue bg-blue-50 px-2 py-0.5 mt-1 inline-block border border-blue-100 shadow-sm">{b.gymName}</span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 border shadow-sm ${b.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{b.status}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-mono text-gray-500 mt-3 pt-3 border-t border-dashed border-gray-200">
                                                <span>{b.date} • {b.type} • {b.trainerName || 'No Trainer'}</span>
                                                <span className="font-black text-brand-charcoal text-base">฿{b.totalPrice}</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </BlockTable>
                    )}
                </div>
            </div>

            {isGymFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-charcoal/80 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto border-4 border-brand-charcoal shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]">
                        <div className="sticky top-0 p-4 border-b-2 border-brand-charcoal bg-brand-bone flex justify-between items-center z-10">
                            <h2 className="font-black uppercase tracking-widest">{editingGym?.id ? `Edit ${editingGym.name}` : 'New Facility'}</h2>
                            <button onClick={() => { setIsGymFormOpen(false); setEditingGym(null); }} className="hover:text-brand-red"><X className="w-6 h-6" /></button>
                        </div>
                        
                        {managingScheduleFor ? (
                            // SCHEDULE MANAGER (Takes over the modal when a trainer is selected)
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center pb-4 border-b-2 border-brand-charcoal">
                                    <h3 className="font-black uppercase text-xl">Schedule for {managingScheduleFor.name}</h3>
                                    <button type="button" onClick={() => setManagingScheduleFor(null)} className="text-sm font-mono underline hover:text-brand-red font-bold">Back to Facility</button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        {trainerSchedules.length === 0 && <div className="text-sm text-gray-400 font-mono py-4 text-center">No scheduling slots configured.</div>}
                                        {trainerSchedules.map(s => (
                                            <div key={s.id} className="flex justify-between items-center bg-gray-50 p-4 border-2 border-brand-charcoal">
                                                <div className="font-mono text-sm">
                                                    <span className="font-black mr-4 uppercase w-24 inline-block">{s.dayOfWeek}</span>
                                                    {s.startTime} - {s.endTime}
                                                </div>
                                                <button type="button" onClick={async () => {
                                                    await deleteTrainerSchedule(s.id);
                                                    setTrainerSchedules(await getTrainerSchedules(managingScheduleFor.id));
                                                }} className="text-brand-red font-black text-xs hover:underline uppercase tracking-wide">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-6 border-t-2 border-brand-charcoal/20">
                                        <h4 className="font-bold text-sm uppercase mb-4 text-brand-charcoal">Add New Slot</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <select className="border-2 border-brand-charcoal p-3 font-mono text-sm" value={newSchedule.day} onChange={e => setNewSchedule({ ...newSchedule, day: e.target.value })}>
                                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <input type="time" className="border-2 border-brand-charcoal p-3 font-mono text-sm w-full" value={newSchedule.start} onChange={e => setNewSchedule({ ...newSchedule, start: e.target.value })} />
                                            <input type="time" className="border-2 border-brand-charcoal p-3 font-mono text-sm w-full" value={newSchedule.end} onChange={e => setNewSchedule({ ...newSchedule, end: e.target.value })} />
                                            <button type="button" onClick={async () => {
                                                if (!managingScheduleFor) return;
                                                await createTrainerSchedule({
                                                    trainerId: managingScheduleFor.id,
                                                    dayOfWeek: newSchedule.day,
                                                    startTime: newSchedule.start,
                                                    endTime: newSchedule.end
                                                });
                                                setTrainerSchedules(await getTrainerSchedules(managingScheduleFor.id));
                                            }} className="bg-brand-charcoal text-white font-black text-sm uppercase py-3 hover:bg-brand-blue transition-colors">Add</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveGym} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <input className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="GYM NAME" value={editingGym?.name || ''} onChange={e => setEditingGym({...editingGym, name: e.target.value})} required />
                                    <input className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="LOCATION" value={editingGym?.location || ''} onChange={e => setEditingGym({...editingGym, location: e.target.value})} required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <select className="border-2 border-brand-charcoal p-4 font-mono text-sm" value={editingGym?.category || 'gym'} onChange={e => setEditingGym({...editingGym, category: e.target.value as 'gym' | 'camp'})} required>
                                        <option value="gym">Gym</option>
                                        <option value="camp">Camp</option>
                                    </select>
                                    <input type="number" className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder={editingGym?.category === 'camp' ? "CAMP PRICE (TOTAL)" : "PRICE (THB)"} value={editingGym?.basePrice || ''} onChange={e => setEditingGym({...editingGym, basePrice: parseFloat(e.target.value)})} required />
                                    <input type="number" className="border-2 border-brand-charcoal p-4 font-mono text-sm" placeholder="AFFILIATE % (OPTIONAL)" value={editingGym?.affiliatePercentage || ''} onChange={e => setEditingGym({...editingGym, affiliatePercentage: parseFloat(e.target.value)})} title="Commission for affiliates" />
                                </div>

                                {editingGym?.category === 'camp' && (
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-brand-bone border-2 border-brand-charcoal">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Start Date</label>
                                            <input type="date" className="w-full border-2 border-brand-charcoal p-3 font-mono text-sm" value={editingGym?.startDate || ''} onChange={e => setEditingGym({...editingGym, startDate: e.target.value})} required />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">End Date</label>
                                            <input type="date" className="w-full border-2 border-brand-charcoal p-3 font-mono text-sm" value={editingGym?.endDate || ''} onChange={e => setEditingGym({...editingGym, endDate: e.target.value})} required />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-brand-charcoal">Profile / Cover Photo</label>
                                        <div className="flex gap-4 items-center">
                                            {editingGym?.profilePhoto && <img src={editingGym.profilePhoto} className="w-20 h-20 object-cover border-4 border-brand-charcoal" alt="Preview" />}
                                            <input type="file" accept="image/*" onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    try {
                                                        const { uploadImage } = await import('../services/dataService');
                                                        const url = await uploadImage('gyms', file);
                                                        if (url) setEditingGym({...editingGym, profilePhoto: url});
                                                    } catch (err) { alert("Upload failed"); }
                                                }
                                            }} className="flex-1 border-2 border-brand-charcoal p-4 font-mono text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-black file:uppercase file:bg-brand-charcoal file:text-white" />
                                        </div>
                                    </div>
                                    <input className="w-full border-2 border-brand-charcoal p-4 font-mono text-sm" value={editingGym?.socialMedia || ''} onChange={e => setEditingGym({ ...editingGym, socialMedia: e.target.value })} placeholder="Social Media (Instagram/Facebook URL)" />
                                    <textarea className="w-full border-2 border-brand-charcoal p-4 font-mono text-sm h-32" placeholder="DESCRIPTION" value={editingGym?.description || ''} onChange={e => setEditingGym({...editingGym, description: e.target.value})}></textarea>
                                </div>

                                {/* Trainers Section only visible when editing existing gym */}
                                {editingGym?.id && (
                                    <div className="pt-6 border-t-2 border-brand-charcoal border-dashed space-y-4">
                                        <h4 className="font-black text-sm uppercase text-brand-charcoal">Trainers Roster</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto">
                                            {myGyms.find(g => g.id === editingGym.id)?.trainers?.map((t: Trainer) => (
                                                <div key={t.id} className="flex justify-between items-center bg-gray-50 border-2 border-brand-charcoal p-3">
                                                    <div className="font-bold uppercase text-sm">{t.name} <span className="font-mono text-[10px] text-gray-500 font-normal ml-1">({t.specialty})</span></div>
                                                    <div className="flex gap-4">
                                                        <button type="button" onClick={async () => {
                                                            setManagingScheduleFor(t);
                                                            setTrainerSchedules(await getTrainerSchedules(t.id));
                                                        }} className="text-brand-blue font-black uppercase hover:underline text-[10px]">Schedule</button>
                                                        <button type="button" onClick={async () => {
                                                            if (confirm('Remove trainer?')) {
                                                                await deleteTrainer(t.id);
                                                                refreshGyms();
                                                            }
                                                        }} className="text-brand-red font-black uppercase hover:underline text-[10px]">Del</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-4 border-2 border-brand-charcoal p-4 bg-brand-bone">
                                            <input className="border-2 border-brand-charcoal focus:border-brand-blue outline-none text-sm flex-1 font-mono p-3" placeholder="NEW TRAINER NAME" value={newTrainer.name} onChange={e => setNewTrainer({ ...newTrainer, name: e.target.value })} />
                                            <input className="border-2 border-brand-charcoal focus:border-brand-blue outline-none text-sm w-full md:w-1/3 font-mono p-3" placeholder="SPECIALTY" value={newTrainer.specialty} onChange={e => setNewTrainer({ ...newTrainer, specialty: e.target.value })} />
                                            <button type="button" onClick={async () => {
                                                if (newTrainer.name && editingGym.id) {
                                                    await createTrainer({ ...newTrainer, gymId: editingGym.id, pricePerSession: 500 } as any);
                                                    setNewTrainer({ name: '', specialty: '', pricePerSession: 500, image: '' });
                                                    refreshGyms();
                                                }
                                            }} className="bg-brand-charcoal text-white px-8 font-black text-sm uppercase hover:bg-brand-blue transition-colors">Add Trainer</button>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-8">
                                    <button type="submit" className="w-full bg-brand-red text-white py-4 font-black text-lg uppercase hover:bg-brand-charcoal transition-colors">
                                        Save Facility
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
