import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const StyledSwal = MySwal.mixin({
  customClass: {
    popup: 'styled-swal-popup',
    title: 'styled-swal-title',
    htmlContainer: 'styled-swal-content',
    confirmButton: 'styled-swal-confirm',
    cancelButton: 'styled-swal-cancel',
  },
  buttonsStyling: false,
  background: '#111720',
  color: '#eef2f7',
});

export default StyledSwal;
