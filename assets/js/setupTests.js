import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { library as faLibrary } from '@fortawesome/fontawesome'
import faMapMarker from '@fortawesome/fontawesome-free-solid/faMapMarker'
import faLock from '@fortawesome/fontawesome-free-solid/faLock'
import faSpinner from '@fortawesome/fontawesome-free-solid/faSpinner'
import faLocationArrow from '@fortawesome/fontawesome-free-solid/faLocationArrow'
import faGithub from '@fortawesome/fontawesome-free-brands/faGithub'

faLibrary.add(faMapMarker, faLock, faSpinner, faGithub, faLocationArrow)

configure({ adapter: new Adapter() });
