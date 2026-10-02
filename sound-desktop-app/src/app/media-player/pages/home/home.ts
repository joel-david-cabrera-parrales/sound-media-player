import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { PROFILE_STORAGE_KEY } from '../../../shared/utils/profile-photo';

const COVERS = 'https://lh3.googleusercontent.com/aida-public/';

interface QuickItem {
  img: string;
  title: string;
  titleKey?: string;
  sub: string;
  subKey?: string;
}

interface Release {
  img: string;
  title: string;
  artist: string;
  year: string;
}

interface ContinueItem {
  img: string;
  badgeKey: string;
  title: string;
  author: string;
  progress: number;
  left: string;
  leftKey?: string;
  leftParams?: Record<string, unknown>;
  right: string;
  rightKey?: string;
  rightParams?: Record<string, unknown>;
}

interface Genre {
  nameKey: string;
  descKey: string;
  accent: 'primary' | 'secondary' | 'bright';
}

function getProfileFirstName(): string {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return 'Alex';
    const profile = JSON.parse(raw) as { name?: unknown };
    if (typeof profile.name === 'string' && profile.name.trim()) {
      return profile.name.trim().split(/\s+/)[0];
    }
    return 'Alex';
  } catch {
    return 'Alex';
  }
}

@Component({
  selector: 'media-player-home',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly userName = getProfileFirstName();
  protected readonly resumeTrack = 'Midnight City • M83';

  protected readonly greetingKey: string = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'home.greeting.morning';
    if (hour < 20) return 'home.greeting.afternoon';
    return 'home.greeting.night';
  })();

  protected readonly quickAccess: QuickItem[] = [
    {
      img: `${COVERS}AB6AXuAOzf7sv_BQk1agUeSvw2V-nlvfec8PkMREVmm7I3wH_fXhD7HqOI54dSa-DkW45DqYqFY2EYGsT_wYk-9FlSo3RLyKX6OMNL4QfgDS3ZbbkYcog-qyB06Qb8GHaXQ74AI7Bxw4sFSGlB8ZlNXzxiMxokbaEJBNZe8GuaOuHpYCiOqt4ifdHcr9rvGoSWdOLE82yAAfHBIeIZhLoC-My1LnmQrOLY5m9AGKiX0URi25V5Ul5OyphZGJzg`,
      title: 'Daily Mix 1',
      sub: 'Kavinsky, Gunship, The Midnight',
    },
    {
      img: `${COVERS}AB6AXuBhcneR6GQ4CDBtqyMGdHQ7KuQX2S4ksV6e6xym0PUxMDofP5IZ5LteVqPpnJkjSpV1UYJLGWyrNYU2m9xOUA8Ep96OoyQ35C4c_hPA7jo4VNbTixDAvfpa5No2klbp7U_JKr4j4-JLxxLjnCV4Av_1CS-8IF8XBv-fskmoCDfouQrE0e0YTzTwCK2Wmgtd_NiPxNVM1hDqMWO3v2vjKOmmPZ7jVkW7-FhzXB09rNXVJfbtDAIYek3p9Q`,
      title: 'Synthwave & Retrowave',
      sub: '',
      subKey: 'home.quick.spatial',
    },
    {
      img: `${COVERS}AB6AXuBLTnOQckbi87n2nI4fhZwS-obAVIh-xCaDEZV1RlQWEdqqZau1XI_m9c_GIWbr6W5FhGS8zhj55K2diwoCyp1uUoaMGfRIF17eX2SubeYeOTDyQwWf029U7dYJET6yq4K21oRantKEvqqSN3I92makEd3vBrfZH5e8uMUqzLToEpMsLCO9uLqSar-WMRh2VzlgUfqD0lNh1-ZIdLwzr0CJny2qoiPdPOcnYxQUmA0lQEQucQnRVUfVqQ`,
      title: '',
      titleKey: 'home.quick.weeklyTitle',
      sub: '',
      subKey: 'home.quick.weekly',
    },
    {
      img: `${COVERS}AB6AXuAvl_26Bayhcuuad9bxcQF9gCWlcjeZ8_z7Om2vllfNNMRqGM0cXWoqrFuDsNATIf2sBDKy5qCuTzXpkWz-iOkTApfXv9ss9vjCNlub9n4h5DuzfqSLxK1RoYaTFxWgGFBsIAVDsgL8yiWvQI2sBxRFjyG6WWCaZOJ0LC34lltc4T_td8ApZSmF2NwXKJ46prmCKN8WWnaPqbaQ2LCER3KAcA9ePi9k2MAKcwkE4-je-RZVVmkrA6JQgg`,
      title: "M83 - Hurry Up, We're Dreaming",
      sub: '',
      subKey: 'home.quick.album',
    },
    {
      img: `${COVERS}AB6AXuDfgPxMzKnVCEQ7cGhPNT2jkMizl-xEebpvqJe-13uq9h_ZK6PnW2XrC2VwjnZ8XpqEVxiKcK8hWLv7Lt4yn1X6fvcHm9oclOqP4dmj_hR2GTllcAcVHCoO8rmjny-K-jnZacH5bLBrTt6wvdIpAmF_MVuAl7irANgJJzMY6vqwL3wt6SnFrxAIwsBg4HzyCsw-hnquh6TbmHy_B3h3_N2bKxnJcf1i1BUce2JCXK8UTNbdJf3y-rYzqw`,
      title: '',
      titleKey: 'home.quick.favoritesTitle',
      sub: '',
      subKey: 'home.quick.selected',
    },
    {
      img: `${COVERS}AB6AXuC-dIWFuxpmHzgliHMrO6jE1R8lMOR6wWsDShvDX4iI15wY0fsCDxhHhlADEmzVkq0rQvQfNUFQ61c7cx2CA8gXtTkHDItPpGnsEgJTo2z-iOl9NzKZhTOy9jKSUm-5zEmszGcP2qwKA6y16IdTEpGrYS28DpeJBvqwEsn-0HnDxkyypUXaChadFTuvjBiskdnKERXkuQ92A1RKPKLuUe-_aoi7xwQcLZT_sVVTQfoj3_vpQ0GUmujfzw`,
      title: 'FLAC Studio Masters',
      sub: '',
      subKey: 'home.quick.masters',
    },
  ];

  protected readonly releases: Release[] = [
    {
      img: `${COVERS}AB6AXuCmCV41-pAwVNZmRmUhJplKiVegaEstpQq1H2ItQa9UjL9xtjNOjbqHENS_tzT3W-kQ06DgJBzYARwTRG-gJh9pyb89lg05BWYe7LvAcjT-q0UNolsMbWHQHTulr3wsDJPmZle1LSuQICtgSyBwisf26mwW5YHSSGOQTnqQk_PK9ViIrm2uKsE6_Jhhapu76gyk2oEQUIJ2bU8jRE2czmfIg3xx-mW9J-xeN0q9XbGvv5ODsxZ2MU29WA`,
      title: 'Singularity Continuum',
      artist: 'Jon Hopkins',
      year: '2024',
    },
    {
      img: `${COVERS}AB6AXuCVPGpO_LVlCSLr7qBxTjKxpWA-AHDRx0d5mCabt3ImVaQsjyxNFFZCXht8RzYJQcdeJFIzgu0TlHy913Ht2kcrvW0CMQz4PxHDK073PUtUsJ1DMLQWb94WQW-YLg3fknTql_PDnHlMoOQrqGgTwpbisJxZb5mEpz3VgyYANxabm2x7x1lIM4b7nOS7TRjrU8XpLC0VEun6K0pWiqVqhvujrym3mPFoXI3RXyFmxwOCpVBehzJbnd_ZJg`,
      title: 'Chroma Waves (Live)',
      artist: 'Bicep',
      year: '2023',
    },
    {
      img: `${COVERS}AB6AXuBhIJMhOXmGu0T7pTL4bDLQ8jjXqaaob4xrthKKRFsUI2YCz97Q6R7lI_P0XCvsN_sF8vR8LBhCVFn_ZGpAuwwdRdNMDiSnrgYtdiNRagF-JkZ6UsUq9OXHBLbbUigwMjdug-e_QFy9vLRiz1vHhX6vtJUMcT9V3ilW-261TYh1OzVY_iua9wQazy_TYnxpR0F9f0JB8qaWWJvhdgPNHQ5HHBZRBic8I_MyM75bmZ-L2jT2q3oyLz7wjQ`,
      title: 'Nordic Reverie',
      artist: 'Ólafur Arnalds',
      year: '2024',
    },
    {
      img: `${COVERS}AB6AXuC3FdQA2tZZwCoUIEuBq1RFsWoZsAuRqNr9DO4nLIJBpfO0eEzCK00BF1BnrskyCXW1DBm3ZoWBDpyE7UjuRaeNYezct6vFNmEOHg3oj4m698elvh9jzJJ_HKzLpZKGjuYFFQMParzN0Ap3tyOZdIsIwPJfFJURfSx2GAB9QxPsNWwUy7RmdmJB3JDE5c_PLjjnYLXIo6n_phml5CkDaZiS3EyHkXXlMfRj9yt6NG-JiGvU37Jesiy_NQ`,
      title: 'Vortex Protocol',
      artist: 'Daniel Deluxe',
      year: '2023',
    },
    {
      img: `${COVERS}AB6AXuCD7Y8d2FKAONrSmLD4DHhcARm9XteZxGqqPg99os_sVeBsLrBNtVhwlVXzNEzSQwYiK7x6NBz0VXkSS0U2GU2lYz-WCvdNgwBkLFoyCBCBjBlm81JC_8sKLSCIXymfGH9na35DnFo3ubzlB4dfKOyIm42xYs9-O5KEPWc8sb9YqfMfvdrRouzD5EvD2Lnn9G5AkLYYVf_oWdXgIrCSIWR1QKswSpvntFw_vNgWP4We3MFZrNB8MupPRw`,
      title: 'Subconscious Space',
      artist: 'Max Cooper',
      year: '2024',
    },
  ];

  protected readonly continueListening: ContinueItem[] = [
    {
      img: `${COVERS}AB6AXuAvMteAP2RUiesbbLZr323zyecV2dEzxln2uD3rmK-yig6LPDp3IN8jl8TSiC0uoXMYEd8m0xLhiPeTPgbJahJunQvIoROOv2N6czsrGZ3UzeH5lHdXqClpt877Gj6H_byQmdtu_KwlxeTBcj4HR2NKc6dIRJ9zxPH4eqdztD6uyEMeHE2S5D73b_HXhmwevKJGoNsbAMF3OX9pIdqGvdPQIb18lvP-Su3O67-mHMnhS3O-RxoJWQaR7g`,
      badgeKey: 'home.continue.podcast',
      title: 'Mastering para Streaming Hi-Res',
      author: 'The Audio Engineering Guild',
      progress: 68,
      left: '32:10',
      right: '',
      rightKey: 'home.continue.remaining',
      rightParams: { time: '15m' },
    },
    {
      img: `${COVERS}AB6AXuD9i1JgPK7UmFILqr71MytL4Lw5A486rGJrrSxkv-kXCqzLxXiNj2c00-iIg_8ofF-sG-0wagQ7WByNj1L4Y-gAOx5QxBAOBk3LnlKodi98_H415OS1esVygaP-DBepj2_Y_MW-dpoDtz_V7b_-ceXZdZ37fGKS77ld08jVYPEBHQAzxsCj2jNdY_XO_Y3cbz-b1bxz5WRhYR5KfE-kPFhbvHkTqIsGyIeSJFDwIGVWbQ7aZanJVPhcQA`,
      badgeKey: 'home.continue.album',
      title: 'Analog Dreams & Waves',
      author: 'Tycho • Epoch Master',
      progress: 42,
      left: '',
      leftKey: 'home.continue.trackOf',
      leftParams: { current: 4, total: 11 },
      right: '42%',
    },
    {
      img: `${COVERS}AB6AXuAR2yZe6hNyl1_Ft7jcD0agXdXllk2EUpajBrdXqhCxXtvKNm1jYwahnjWp1qq_GuOIIiVc03Oemp37aQ9dY83hl7gNzj1qZHfEUtnAp-iq7X4I3A6uxRJUt6EwKubWT3jl1aQH8RJeerhiJuLkjRtFahn7fLzeh0yClMURbqzv5mwADjg3WHD4HWc_2XfnVGq5CZ9FtUzYIDg0E-hndQbyWGtuBf0FqhB9_3IDtDNTC5EUUKlrRREENQ`,
      badgeKey: 'home.continue.live',
      title: 'Blue Note Live Sessions',
      author: 'Miles Davis Sextet Remaster',
      progress: 85,
      left: '54:12',
      right: '',
      rightKey: 'home.continue.remaining',
      rightParams: { time: '8m' },
    },
  ];

  protected readonly genres: Genre[] = [
    { nameKey: 'home.genres.electronic', descKey: 'home.genres.radio', accent: 'primary' },
    { nameKey: 'home.genres.ambient', descKey: 'home.genres.immersive', accent: 'secondary' },
    { nameKey: 'home.genres.synthwave', descKey: 'home.genres.retro', accent: 'primary' },
    { nameKey: 'home.genres.rock', descKey: 'home.genres.master', accent: 'bright' },
    { nameKey: 'home.genres.lofi', descKey: 'home.genres.focus', accent: 'primary' },
  ];
}
