import { useState } from "react";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { events, Event } from "@/data/events";
import EventModal from "@/components/events/EventModal";

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const today = new Date();

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true;

    const eventDate = new Date(event.date);
    return filter === "upcoming"
      ? eventDate >= today
      : eventDate < today;
  });

  return (
    <div className="container">
      <div className="row">

        {/* SIDEBAR (LEFT) */}
        <div className="col-md-4 col-lg-3">
          <div className="sidebar2 p-t-80 p-b-80 p-r-20">

            <h4 className="txt33 p-b-30">Filter Events</h4>

            {/* EVENT TYPE */}
            <div className="p-b-40">
              <h5 className="p-b-15">Event Type</h5>

              {["all", "upcoming", "past"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type as any)}
                  className={`dis-block txt27 p-b-10 ${
                    filter === type ? "text-success" : ""
                  }`}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} Events
                </button>
              ))}
            </div>

            {/* INFO BOX */}
            <div className="bo5-t p-t-30">
              <p className="txt14">
                Our events capture moments of collaboration, learning,
                and celebration—both online and in person.
              </p>
            </div>

          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="col-md-8 col-lg-9">
          <div className="p-t-80 p-b-80">

            {/* HEADER */}
            <div className="p-b-50">
              <h3 className="txt33">Events & Highlights</h3>
              <p className="txt14 m-t-10">
                From company gatherings to community workshops,
                explore the moments that shape our journey.
              </p>
            </div>

            {/* EVENT GRID */}
            <div className="row">
              {filteredEvents.map((event) => (
                <div key={event.id} className="col-md-6 p-b-40">
                  <div className="blo4 bo-rad-10 of-hidden h-full">

                    {/* IMAGE PREVIEW */}
                    <div
                      className="hov-img-zoom"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <img
                        src={`/images/${event.images[0]}`}
                        alt={event.title}
                        style={{ width: "100%", height: "auto" }}
                      />
                    </div>

                    {/* CONTENT */}
                    <div className="p-20">
                      <h4 className="p-b-10">{event.title}</h4>

                      <div className="txt32 flex-w p-b-10">
                        <span>
                          {event.date}
                          <span className="m-r-6 m-l-4">|</span>
                        </span>
                        <span>{event.location}</span>
                      </div>

                      <p className="txt14">
                        {event.description.split("\n")[0]}
                      </p>

                      <button
                        className="txt4 m-t-15"
                        onClick={() => setSelectedEvent(event)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        View Details →
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* EMPTY STATE */}
            {filteredEvents.length === 0 && (
              <p className="txt14">No events found.</p>
            )}

          </div>
        </div>

      </div>

      {/* MODAL */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

EventsPage.Layout = LandingPageLayout;

export async function getServerSideProps() {
  return {
    props: {
      pageData: {
        title: "Events",
      },
    },
  };
}
