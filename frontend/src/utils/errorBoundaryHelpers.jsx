import RouteErrorBoundary from '../components/ErrorBoundary/RouteErrorBoundary';

/**
 * Wraps a component with RouteErrorBoundary
 * @param {React.Component} Component - The component to wrap
 * @param {string} routeName - The name of the route for error messages
 */
export function withRouteErrorBoundary(Component, routeName) {
  return function WrappedComponent(props) {
    return (
      <RouteErrorBoundary routeName={routeName}>
        <Component {...props} />
      </RouteErrorBoundary>
    );
  };
}
