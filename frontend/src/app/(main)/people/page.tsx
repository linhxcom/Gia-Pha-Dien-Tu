'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface Person {
    handle: string;
    displayName: string;
    gender: number;
    birthYear?: number;
    deathYear?: number;
    isLiving: boolean;
    isPrivacyFiltered: boolean;
    _privacyNote?: string;
}

export default function PeopleListPage() {
    const router = useRouter();
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState<number | null>(null);
    const [livingFilter, setLivingFilter] = useState<boolean | null>(null);

    // State cho Modal thêm thành viên
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newGender, setNewGender] = useState(1);
    const [newGeneration, setNewGeneration] = useState(1);
    const [newIsLiving, setNewIsLiving] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchPeople = async () => {
            try {
                const { supabase } = await import('@/lib/supabase');
                const { data, error } = await supabase
                    .from('people')
                    .select('handle, display_name, gender, birth_year, death_year, is_living, is_privacy_filtered')
                    .order('display_name', { ascending: true });
                if (!error && data) {
                    setPeople(data.map((row: Record<string, unknown>) => ({
                        handle: row.handle as string,
                        displayName: row.display_name as string,
                        gender: row.gender as number,
                        birthYear: row.birth_year as number | undefined,
                        deathYear: row.death_year as number | undefined,
                        isLiving: row.is_living as boolean,
                        isPrivacyFiltered: row.is_privacy_filtered as boolean,
                    })));
                }
            } catch { /* ignore */ }
            setLoading(false);
        };
        fetchPeople();
    }, []);

    const handleAddPerson = async () => {
        if (!newName.trim()) {
            alert('Vui lòng nhập họ tên');
            return;
        }
        setIsSubmitting(true);
        try {
            const { supabase } = await import('@/lib/supabase');
            const newHandle = 'P' + Date.now(); // Tạo mã ID ngẫu nhiên dựa trên thời gian
            const { error } = await supabase.from('people').insert([{
                handle: newHandle,
                display_name: newName.trim(),
                gender: newGender,
                generation: newGeneration,
                is_living: newIsLiving,
                is_patrilineal: true
            }]);

            if (error) throw error;

            // Cập nhật danh sách hiển thị ngay lập tức
            setPeople(prev => [...prev, {
                handle: newHandle,
                displayName: newName.trim(),
                gender: newGender,
                isLiving: newIsLiving,
                isPrivacyFiltered: false
            }]);

            setIsModalOpen(false);
            setNewName('');
            setNewGeneration(1);
        } catch (err: any) {
            alert('Có lỗi xảy ra: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filtered = people.filter((p) => {
        if (search && !p.displayName.toLowerCase().includes(search.toLowerCase())) return false;
        if (genderFilter !== null && p.gender !== genderFilter) return false;
        if (livingFilter !== null && p.isLiving !== livingFilter) return false;
        return true;
    });

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Thành viên gia phả
                    </h1>
                    <p className="text-muted-foreground">{people.length} người trong gia phả</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Thêm thành viên
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Tìm theo tên..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="flex gap-2">
                    <Button variant={genderFilter === null ? 'default' : 'outline'} size="sm" onClick={() => setGenderFilter(null)}>Tất cả</Button>
                    <Button variant={genderFilter === 1 ? 'default' : 'outline'} size="sm" onClick={() => setGenderFilter(1)}>Nam</Button>
                    <Button variant={genderFilter === 2 ? 'default' : 'outline'} size="sm" onClick={() => setGenderFilter(2)}>Nữ</Button>
                </div>
                <div className="flex gap-2">
                    <Button variant={livingFilter === null ? 'default' : 'outline'} size="sm" onClick={() => setLivingFilter(null)}>Tất cả</Button>
                    <Button variant={livingFilter === true ? 'default' : 'outline'} size="sm" onClick={() => setLivingFilter(true)}>Còn sống</Button>
                    <Button variant={livingFilter === false ? 'default' : 'outline'} size="sm" onClick={() => setLivingFilter(false)}>Đã mất</Button>
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Họ tên</TableHead>
                                    <TableHead>Giới tính</TableHead>
                                    <TableHead>Năm sinh</TableHead>
                                    <TableHead>Năm mất</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((p) => (
                                    <TableRow
                                        key={p.handle}
                                        className="cursor-pointer hover:bg-accent/50"
                                        onClick={() => router.push(`/people/${p.handle}`)}
                                    >
                                        <TableCell className="font-medium">
                                            {p.displayName}
                                            {p.isPrivacyFiltered && <span className="ml-1 text-amber-500">🔒</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {p.gender === 1 ? 'Nam' : p.gender === 2 ? 'Nữ' : '?'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{p.birthYear || '—'}</TableCell>
                                        <TableCell>{p.deathYear || (p.isLiving ? '—' : '?')}</TableCell>
                                        <TableCell>
                                            <Badge variant={p.isLiving ? 'default' : 'secondary'}>
                                                {p.isLiving ? 'Còn sống' : 'Đã mất'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            {search ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu gia phả'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Modal Thêm Người Mới */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="w-full max-w-md shadow-lg">
                        <CardHeader>
                            <CardTitle>Thêm thành viên mới</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Họ và tên</label>
                                <Input 
                                    value={newName} 
                                    onChange={e => setNewName(e.target.value)} 
                                    placeholder="VD: Hoàng Văn A" 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Giới tính</label>
                                <div className="flex gap-2">
                                    <Button variant={newGender === 1 ? 'default' : 'outline'} onClick={() => setNewGender(1)} className="flex-1">Nam</Button>
                                    <Button variant={newGender === 2 ? 'default' : 'outline'} onClick={() => setNewGender(2)} className="flex-1">Nữ</Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Đời thứ mấy</label>
                                <Input 
                                    type="number" 
                                    min="1" 
                                    value={newGeneration} 
                                    onChange={e => setNewGeneration(parseInt(e.target.value) || 1)} 
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Trạng thái</label>
                                <div className="flex gap-2">
                                    <Button variant={newIsLiving === true ? 'default' : 'outline'} onClick={() => setNewIsLiving(true)} className="flex-1">Còn sống</Button>
                                    <Button variant={newIsLiving === false ? 'default' : 'outline'} onClick={() => setNewIsLiving(false)} className="flex-1">Đã mất</Button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                                <Button onClick={handleAddPerson} disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu thành viên'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
