import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CreateGroupDialog } from '../components/CreateGroupDialog';
const api=vi.hoisted(()=>({friends:vi.fn(),search:vi.fn(),create:vi.fn(),request:vi.fn()}));
vi.mock('../services/friendshipsApi',()=>({fetchFriendships:api.friends}));
vi.mock('../services/directChatApi',()=>({searchChatUsers:api.search}));
vi.mock('../services/chatGroupApi',()=>({createChatGroup:api.create}));
vi.mock('../services/travelGroupApi',async original=>({...await original<object>(),chatRequest:api.request}));
beforeEach(()=>{vi.clearAllMocks();api.friends.mockResolvedValue([{userId:2,displayName:'Bob',avatarUrl:null,status:'Accepted',requestedByUserId:1},{userId:3,displayName:'Carol',avatarUrl:null,status:'Accepted',requestedByUserId:1}]);api.request.mockResolvedValue({items:[{itineraryId:9,title:'My trip',canManage:true}],totalCount:1});});
afterEach(cleanup);
it('requires two other people and reuses the request identity after a network failure',async()=>{
 api.create.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({groupId:9,groupName:'Weekend',hostUserId:1,memberCount:3});
 const created=vi.fn();render(<CreateGroupDialog userId={1} canCreateTravel onClose={vi.fn()} onChatCreated={created} onTravelCreated={vi.fn()}/>);
 fireEvent.change(screen.getByRole('textbox',{name:'Tên nhóm'}),{target:{value:'Weekend'}});
 await screen.findByRole('checkbox',{name:'Bob'});
 fireEvent.click(screen.getByRole('button',{name:'Tạo nhóm'}));expect(api.create).not.toHaveBeenCalled();expect(screen.getByRole('alert').textContent).toContain('Chọn từ 2');
 fireEvent.click(screen.getByRole('checkbox',{name:'Bob'}));fireEvent.click(screen.getByRole('checkbox',{name:'Carol'}));fireEvent.click(screen.getByRole('button',{name:'Tạo nhóm'}));
 await waitFor(()=>expect(api.create).toHaveBeenCalledTimes(1));await waitFor(()=>expect(screen.getByRole('button',{name:'Tạo nhóm'}).hasAttribute('disabled')).toBe(false));
 fireEvent.click(screen.getByRole('button',{name:'Tạo nhóm'}));await waitFor(()=>expect(created).toHaveBeenCalled());expect(api.create.mock.calls[0][2]).toBe(api.create.mock.calls[1][2]);
});
it('creates an itinerary-linked travel group with the existing idempotency header',async()=>{
 const created=vi.fn();render(<CreateGroupDialog userId={1} canCreateTravel onClose={vi.fn()} onChatCreated={vi.fn()} onTravelCreated={created}/>);
 fireEvent.click(screen.getByRole('button',{name:'Nhóm du lịch'}));await screen.findByRole('option',{name:'My trip'});
 fireEvent.change(screen.getByRole('textbox',{name:'Tên nhóm'}),{target:{value:'Trip group'}});fireEvent.change(screen.getByRole('combobox',{name:'Lịch trình'}),{target:{value:'9'}});
 api.request.mockResolvedValueOnce({groupId:11,groupName:'Trip group',itineraryId:9,hostUserId:1});fireEvent.click(screen.getByRole('button',{name:'Tạo nhóm'}));
 await waitFor(()=>expect(created).toHaveBeenCalledWith(expect.objectContaining({groupId:11,itineraryId:9})));
 expect(api.request.mock.calls.at(-1)?.[4]).toEqual({'Idempotency-Key':expect.any(String)});
});
