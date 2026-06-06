import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export const fetchMedicines = createAsyncThunk('medicines/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/medicines');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const addMedicine = createAsyncThunk('medicines/add', async (medicineData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/medicines', medicineData);
    toast.success('Medicine added! 💊');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const deleteMedicine = createAsyncThunk('medicines/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/medicines/${id}`);
    toast.success('Medicine removed');
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const medicineSlice = createSlice({
  name: 'medicines',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicines.pending, (state) => { state.loading = true; })
      .addCase(fetchMedicines.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchMedicines.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(addMedicine.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(deleteMedicine.fulfilled, (state, action) => {
        state.items = state.items.filter(m => m._id !== action.payload);
      });
  },
});

export default medicineSlice.reducer;