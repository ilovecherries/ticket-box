import { Nav, Navbar, Container } from "solid-bootstrap";
import { HomeView } from "./HomeView";

export const App = () => {
  return <Container fluid>
    <Navbar class="p-4">
      <Navbar.Brand>
        pBox
      </Navbar.Brand>
      <Navbar.Collapse>
        <Nav>
          <Nav.Item>
            <Nav.Link>Register</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link>Login</Nav.Link>
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
    <HomeView />
  </Container>;
}