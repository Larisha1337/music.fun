import {Playlist} from "../features/playlists.tsx";

function PlaylistsPage() {
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response = await client.GET('/playlists');
  //       // В openapi-fetch данные обычно лежат в response.data, а ошибки в response.error
  //       const data = response.data;
  //       console.log(data);
  //     } catch (error) {
  //       console.error('Ошибка при получении плейлиста:', error);
  //     }
  //   };
  //
  //   fetchData();
  //   }, []);

        return (
            <>
             <Playlist />
            </>
        )
    }

export default PlaylistsPage
