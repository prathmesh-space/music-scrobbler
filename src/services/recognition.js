import axios from 'axios';
import { getApiBaseUrl } from '../config/api';

export async function recognizeSong(audioFile) {
  if (!audioFile) {
    throw new Error('No audio file provided');
  }

  const formData = new FormData();
  formData.append('audio', audioFile);

  try {
    const { data } = await axios.post(`${getApiBaseUrl()}/api/recognize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 20000,
    });

    if (!data?.success) {
      throw new Error(data?.error || data?.message || 'Recognition failed');
    }

    return {
      ...data,
      result: {
        title: data.title,
        artists: data.artists,
        album: data.album,
        releaseDate: data.releaseDate,
        score: data.score,
        genres: data.genres,
        externalIds: data.externalIds,
      },
    };
  } catch (error) {
    const apiError = error.response?.data?.error || error.response?.data?.message;
    throw new Error(apiError || error.message || 'Recognition request failed');
  }
}

export default recognizeSong;
