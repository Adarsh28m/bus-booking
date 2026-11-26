import Route from '../models/Route.js';
import crud from '../utils/crud.js';
export default crud(Route, { search: ['source', 'destination'] });
