import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import geolocate from 'mock-geolocation'

geolocate.use()
configure({ adapter: new Adapter() });
